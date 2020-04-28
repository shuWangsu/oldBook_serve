var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'oldbook'
});

connection.connect();
exports.query = function (sql, callback) {
    connection.query(sql, function (err, result) {
      if (err) {
        console.log('[错误] --- ', err.message);
        return;
      }
      callback(result)    //此处callback就是将值取出来
    });
};

exports.insert = function (sql,params, callback) {
    connection.query(sql,params, function (err, result) {
      if (err) {
        console.log('[错误] --- ', err.message);
        return;
      }
      callback(result)    //此处callback就是将值取出来
    });
};

exports.asyncFunc = function(arr,sql){
  return new Promise(function(resolve,reject) {
    connection.query(sql, function (err, result) {
      if (err) {
        console.log('[错误] --- ', err.message);
        reject()
      }
      arr.push(result)
      // console.log(result)
      resolve(result)    //此处callback就是将值取出来
    });
  })
}