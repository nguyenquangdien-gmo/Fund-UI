function NhacNopPhat2() {
  var spreadSheet = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = spreadSheet.getSheetByName('Nợ đi trễ')
  var members = GetMemberListWithEmail()
  var startRow = 3
  var endRow = startRow + Object.keys(members).length
  var listNotify = []
  for (var row = startRow; row <= endRow; row++) {
    var data = sheet.getRange(row, 2, 1, 19).getValues()[0]
    var name = data[0]
    data = data.splice(2)
    var remain = 0
    data.forEach((cell) => {
      remain += cell ? parseInt(cell) : 0
    })
    if (remain > 0) {
      listNotify.push('\n- @' + members[name].replace('@', '-') + ' ' + remain / 1000 + 'k')
    }
  }
  if (listNotify.length > 0) {
    var url = 'https://chat.runsystem.vn/api/v4/posts'
    var data = {
      message:
        'Các anh/chị/em đã đi trễ quá số ngày cho phép nhưng chưa nộp phạt:' + listNotify.join(''),
      channel_id: 'hz6obkn4t7fz9qzhd5mc55sw4w',
    }
    var options = {
      method: 'post',
      headers: {
        Authorization: 'Bearer xxxxxxxxxxxxxxxxxxxxxx',
      },
      payload: JSON.stringify(data),
    }
    console.log(options)
    var response = UrlFetchApp.fetch(url, options)
    console.log(response.getResponseCode() + ': ' + response.getContentText())
  }
}
