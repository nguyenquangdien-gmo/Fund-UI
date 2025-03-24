function CheckEvents() {
  var today = new Date()
  if (!(today.getHours() == 9 && today.getMinutes() >= 10 && today.getMinutes() <= 15)) {
    return
  }
  var spreadSheet = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = spreadSheet.getSheetByName('Events')
  var members = GetMemberListWithEmail()
  var data = sheet.getRange('A2:E30').getValues()
  var listNotify = []
  var listNotify2 = []
  data.forEach((row) => {
    if (row[0]) {
      var startDate = new Date(row[2])
      var compareDate = new Date(startDate)
      compareDate.setHours(today.getHours())
      compareDate.setMinutes(today.getMinutes())
      compareDate.setSeconds(today.getSeconds())
      compareDate.setMilliseconds(today.getMilliseconds())
      var dateDiff = DateDiff.inDays(today, compareDate)
      if (dateDiff >= 0 && dateDiff < 5) {
        var mains = []
        row[4].split(',').forEach((name) => {
          mains.push('@' + members[name.trim()].replace('@', '-'))
        })
        // Today
        if (dateDiff == 0) {
          listNotify.push(
            '\n- ' +
              row[1] +
              ' lúc ' +
              startDate.getHours() +
              ' giờ ' +
              startDate.getMinutes() +
              ' phút tại ' +
              row[3] +
              '.\nChủ xị: ' +
              mains.join(', '),
          )
        } else {
          // In week
          listNotify2.push(
            '\n- ' +
              (startDate.getDay() === 0 ? 'Chủ Nhật (' : 'Thứ ' + (startDate.getDay() + 1) + ' (') +
              Utilities.formatDate(startDate, 'Asia/Bangkok', 'dd/MM/yyyy') +
              '): ' +
              row[1] +
              ' lúc ' +
              startDate.getHours() +
              ' giờ ' +
              startDate.getMinutes() +
              ' phút tại ' +
              row[3] +
              '.\nChủ xị: ' +
              mains.join(', '),
          )
        }
      }
    }
  })

  if (listNotify.length > 0 || listNotify2.length > 0) {
    var url = 'https://chat.runsystem.vn/api/v4/posts'
    var message = '@all'
    if (listNotify.length > 0) {
      message += '\n#Hôm nay chúng ta có những sự kiện này:' + listNotify.join('')
    }
    if (listNotify2.length > 0) {
      message +=
        '\n\n======================================================================\n\n#Các sự kiện sắp diễn ra:' +
        listNotify2.join('')
    }
    message += '\n\nCác bạn hãy sắp xếp thời gian để tham gia nhé. Thanks.'
    var data = {
      message: message,
      channel_id: 'hz6obkn4t7fz9qzhd5mc55sw4w',
    }
    var options = {
      method: 'post',
      headers: {
        Authorization: 'Bearer xxxxxxxxxxxxxxxxxxxxxxxxx',
      },
      payload: JSON.stringify(data),
    }
    console.log(options)
    var response = UrlFetchApp.fetch(url, options)
    console.log(response.getResponseCode() + ': ' + response.getContentText())
  }
}
