class ApplicationManager {
  static applicationList = []

  static registerApplication(app) {
    ApplicationManager.applicationList.push(app)
  }

  static dispatchData(data) {
    const {dstport: dstPort} = data
    ApplicationManager.applicationList.every(app => {
      if (app.srcPort === dstPort) {
        app.handleData(data)
        return false
      }
      return true
    })
  }
}

module.exports = ApplicationManager
