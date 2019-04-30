const peer = new Peer('receiver', { host: 'localhost', port: 9000, path: '/' })
// peer.on('connection', (conn) => {
//   conn.on('data', (data) => {
//     console.log(data);
//   })
// })
peer.on('call', call => {
    const startChat = async () => {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true
      })
      document.querySelector('video#local').srcObject = localStream
      call.answer(localStream)
      call.on('stream', remoteStream => {
        document.querySelector('video#remote').srcObject = remoteStream
      })
    }
    startChat()
  })