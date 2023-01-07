var readline = require('readline');
const { Atem } = require('atem-connection')

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}
readline.emitKeypressEvents(process.stdin);

const myAtem1 = new Atem()
myAtem1.on('info', console.log)
myAtem1.on('error', console.error)
myAtem1.connect('192.168.1.221')

const myAtem2 = new Atem()
myAtem2.on('info', console.log)
myAtem2.on('error', console.error)
myAtem2.connect('192.168.1.223')

let isConnectedToAtem1 = false
let isConnectedToAtem2 = false

myAtem1.on('connected', () => {
  isConnectedToAtem1 = true
})
myAtem2.on('connected', () => {
  isConnectedToAtem2 = true
})

myAtem1.on('disconnected', () => {
  isConnectedToAtem1 = false
})
myAtem2.on('disconnected', () => {
  isConnectedToAtem2 = false
})

let latestAtem1Me2Preview = null

myAtem1.on('stateChanged', (state, pathToChange) => {
  //console.log('ATEM 1 STATE: ', state)
  latestAtem1Me2Preview = state.video.mixEffects[1].previewInput
})

myAtem2.on('stateChanged', (state, pathToChange) => {
  console.log('ATEM 2 STATE: ', state.video.mixEffects[0].programInput)
})

process.stdin.on('keypress', (chunk, key) => {
  if (key && key.name === 'q') {
    process.exit();
  }
  if (isConnectedToAtem1 || isConnectedToAtem2) {
    if (key.name === 'space') {
      myAtem1.cut(1).then(() => {
        console.log('ATEM 1 CUT ME2')
      })
    }

    // ATEM routing table
    // 1 2 3 4 5 6 7 8 Keypress
    // 1 2 3 4 5 5 5 5 ATEM 1
    // x x x x 1 2 3 4 ATEM 2
    if ((1 <= key.name && key.name <= 4) && latestAtem1Me2Preview !== key.name) {
      myAtem1.changePreviewInput(key.name, 1).then(() => {
        latestAtem1Me2Preview = key.name
        console.log(`ATEM 1 PVW ME2: ${key.name}`)
      })
      //console.log(myAtem1.state)
    }
    if (5 <= key.name && key.name <= 8) {
      if (latestAtem1Me2Preview !== key.name) {  
        myAtem1.changePreviewInput(5, 1).then(() => {
          latestAtem1Me2Preview = 5
          console.log('ATEM 1 PVW ME2: 5')
        })
      }
      //console.log(myAtem1.state)
      const newAtem2ProgramInput = key.name - 4
      myAtem2.changeProgramInput(newAtem2ProgramInput, 0).then(() => {
        console.log(`ATEM 2 PGM ME1: ${newAtem2ProgramInput}`)
      })
      console.log(myAtem2.state)
    }
  }
});
