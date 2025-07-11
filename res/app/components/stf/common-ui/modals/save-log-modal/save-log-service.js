var FileSaver = require('file-saver')

module.exports = function SaveLogsServiceFactory() {
  var SaveLogService = {}

  function formatAsLogcat(logs) {
    return logs.map(log => {
      const date = new Date(log.date * 1000)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const time = log.dateLabel // уже в формате HH:mm:ss.SSS

      return `${month}-${day} ${time} ${log.pid} ${log.tid} ${log.priorityLabel}/${log.tag}: ${log.message}`
    }).join('\n')
  }

  SaveLogService.saveAsLogcat = function(logs, deviceSerial) {
    const content = formatAsLogcat(logs)
    const blob = new Blob([content], {type: 'text/plain;charset=utf-8'})
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    FileSaver.saveAs(blob, `logcat_${deviceSerial}_${timestamp}.log`)
  }

  return SaveLogService
}