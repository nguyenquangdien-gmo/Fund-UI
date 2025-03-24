function CheckinLate() {
  var today = new Date()
  if (!(today.getHours() == 10 && today.getMinutes() >= 5 && today.getMinutes() <= 10)) {
    return
  }
  var spreadSheet = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = spreadSheet.getSheetByName('Sao đỏ')
  var members = GetMemberList(true)
  today.setHours(10, 0, 0, 0)
  var url =
    'https://chat.runsystem.vn/api/v4/channels/mqi9zi75fbdyxrowjirgz4h78r/posts?since=' +
    today.getTime()
  var options = {
    method: 'get',
    headers: {
      Authorization: 'Bearer xxxxxxxxxxxxxxxx',
    },
  }
  var response = UrlFetchApp.fetch(url, options)
  console.log(response.getResponseCode() + ': ' + response.getContentText())
  if (response.getResponseCode() == 200) {
    var content = JSON.parse(response.getContentText())
    var columnDate = today.getDate() + 2
    if (content['order'].length > 0) {
      for (var i = 0; i < content['order'].length; i++) {
        var post = content['posts'][content['order'][i]]
        if (post['create_at'] > today.getTime()) {
          var message = post['message']
          console.log(message)
          var lines = message.split('\n')
          lines.forEach((line, index) => {
            if (index > 6 && line.indexOf('|') == 0) {
              var details = line.split('|')
              var name = details[1].trim()
              var checkin = details[2].trim()
              var memberIndex = members.indexOf(name.toUpperCase())
              if (
                memberIndex >= 0 &&
                checkin != 'Nghỉ phép' &&
                checkin.indexOf('Có đơn NP') < 0 &&
                name.toUpperCase() != 'NGUYỄN THỊ THƠ'
              ) {
                console.log(name + (checkin == '-' ? ' không checkin' : ' đi trễ'))
                console.log(sheet.getRange(memberIndex + 5, columnDate).getValue())
                if (sheet.getRange(memberIndex + 5, columnDate).getValue() != 'O') {
                  sheet.getRange(memberIndex + 5, columnDate).setValue('X')
                }
                sheet
                  .getRange(memberIndex + 5, columnDate)
                  .setBackground('yellow')
                  .setNote(checkin == '-' ? 'không checkin' : ' đi trễ: ' + checkin)
              }
            }
          })
          break
        }
      }
    } else {
      sheet.getRange(4, columnDate).setNote('Không có thông tin check in trễ')
    }
  }
  if (today.getDay() > 0 && today.getDay() < 6) {
    NhacNopPhat2()
  }
}
