var express = require('express')
// 发网络请求
var request = require('request')
var pcrouter = express.Router()
var mysql = require('../mysql/connection')
// 处理时间
var moment = require('moment')

// 登录
pcrouter.post('/pcweb/pclogin', function (req, res) {
  var userInfo = req.body
  var sql = `select count(*) from (admin) where username='${userInfo.username}'`
  var sql1 = `select * from (admin) where username='${userInfo.username}'`
  //查
  mysql.query(sql, result => {
    if (result[0]['count(*)'] == 0) {
      res.send({ status: 404 })
      return
    }
    mysql.query(sql1, result1 => {
      if (userInfo.username == result1[0].username && userInfo.password == result1[0].password) {
        res.send({ status: 500, token: result1[0].token })
      } else {
        res.send({ status: 502 })
      }
    })
  })

})
pcrouter.get('/pcweb/menus', function (req, res) {
  // console.log(req.headers.authorization)
  res.send({ status: 502 })
})

// 获取用户列表数据
pcrouter.get('/pcweb/users', function (req, res) {
  var current_page = 1 //默认为1
  var num = 9 //一页条数
  var sql = 'SELECT COUNT(*) FROM userinfo'
  req.query.query = req.query.query.replace(/\s*/g, "")
  if (req.query.query) {
    var sql1 = `SELECT * FROM userinfo where (openid LIKE '%${req.query.query}%') OR (wxusername LIKE '%${req.query.query}%')`
    mysql.query(sql1, result => {
      result[0].total = result.length
      res.send(result)
    })
    return
  }
  if (req.query.pagenum) {
    current_page = parseInt(req.query.pagenum)
  }
  if (req.query.pagesize) {
    num = parseInt(req.query.pagesize)
  }
  var last_page = current_page - 1
  if (current_page <= 1) {
    last_page = 1
  }
  var str = 'SELECT * FROM userinfo limit ' + num + ' offset ' + num * (current_page - 1)
  mysql.query(str, result => {
    mysql.query(sql, result1 => {
      result[0].total = result1[0]['COUNT(*)']
      res.send(result)
    })
  })
})

// 获取书籍列表数据
pcrouter.get('/pcweb/bookslist', function (req, res) {
  var current_page = 1 //默认为1
  var num = 9 //一页条数
  var sql = 'SELECT COUNT(*) FROM bookinfo'
  req.query.query = req.query.query.replace(/\s*/g, "")
  if (req.query.query) {
    var sql1 = `SELECT * FROM bookinfo where (bookname LIKE '%${req.query.query}%') OR (openid LIKE '%${req.query.query}%') OR (bookauthor LIKE '%${req.query.query}%')  order by uptime desc`
    mysql.query(sql1, result => {
      result[0].total = result.length
      for (var key in result) {
        result[key].uptime = moment(result[key].uptime).format('YYYY-MM-DD')
      }
      res.send(result)
    })
    return
  }
  if (req.query.pagenum) {
    current_page = parseInt(req.query.pagenum)
  }
  if (req.query.pagesize) {
    num = parseInt(req.query.pagesize)
  }
  var last_page = current_page - 1
  if (current_page <= 1) {
    last_page = 1
  }
  // var next_page = current_page + 1
  var str = 'SELECT * FROM bookinfo order by uptime desc limit ' + num + ' offset ' + num * (current_page - 1)
  mysql.query(str, result => {
    // console.log(result.length)
    mysql.query(sql, result1 => {
      result[0].total = result1[0]['COUNT(*)']
      for (var key in result) {
        result[key].uptime = moment(result[key].uptime).format('YYYY-MM-DD')
      }
      res.send(result)
    })
  })
})

//删除书籍
pcrouter.get('/pcweb/deletebook', function (req, res) {
  var bookid = req.query.bookid
  var sql = `delete from bookinfo where bookid = '${bookid}'`
  mysql.query(sql, result => {
    res.send({ status: 502 })
  })
})

// 获取书籍类别
pcrouter.get('/pcweb/classlist', function (req, res) {
  var current_page = 1 //默认为1
  var num = 5 //一页条数
  var sql = 'SELECT COUNT(*) FROM bookclass'
  req.query.query = req.query.query.replace(/\s*/g, "")
  if (req.query.query) {
    var sql1 = `SELECT * FROM bookclass where (className LIKE '%${req.query.query}%')`
    mysql.query(sql1, result => {
      result[0].total = result.length
      res.send(result)
    })
    return
  }
  if (req.query.pagenum) {
    current_page = parseInt(req.query.pagenum)
  }
  if (req.query.pagesize) {
    num = parseInt(req.query.pagesize)
  }
  var last_page = current_page - 1
  if (current_page <= 1) {
    last_page = 1
  }
  // var next_page = current_page + 1
  var str = 'SELECT * FROM bookclass limit ' + num + ' offset ' + num * (current_page - 1)
  mysql.query(str, result => {
    // console.log(result.length)
    mysql.query(sql, result1 => {
      result[0].total = result1[0]['COUNT(*)']
      res.send(result)
    })
  })
})

// 添加书籍类别
pcrouter.post('/pcweb/addbookclass', function (req, res) {
  var classname = req.body.classname
  var sql = `INSERT INTO bookclass(className) VALUES('${classname}')`
  var sql1 = `select count(*) from (bookclass) where className='${classname}'`
  mysql.query(sql1,result => {
    if(result[0]['count(*)'] !== 0) {
      res.send({status: 501})
      return
    }
    mysql.query(sql, result1 => {
      res.send({ status: 502 })
    })
  })
})
// 编辑书籍类别
pcrouter.post('/pcweb/editbookclass',function (req,res) {
  console.log(req.body)
  var classname = req.body.classname
  var classId = req.body.classId
  var sql = `update bookclass set className = '${classname}' where classId = ${classId}`
  mysql.query(sql,result => {
    res.send({status: 502})
  })
})
// 删除书籍类别
pcrouter.get('/pcweb/deletebookclass', function(req,res) {
  var classId = parseInt(req.query.classId)
  var sql = `delete from bookclass where classId = ${classId}`
  mysql.query(sql,result => {
    res.send({status: 502})
  }) 
})
// 改变用户状态 1为禁用 0为正常
pcrouter.post('/pcweb/changestatus', function(req,res) {
  var openid = req.body.openid
  var status = req.body.status
  var sql = `update userinfo set status = ${status} where openid = '${openid}'`
  mysql.query(sql,result => {
    res.send({status: 502})
  })
})
// 获取订单列表
pcrouter.get('/pcweb/orderlist', function(req,res) {
  var current_page = 1 //默认为1
  var num = 5 //一页条数
  var sql = 'SELECT COUNT(*) FROM shoppinglist1'
  req.query.query = req.query.query.replace(/\s*/g, "")
  if (req.query.query) {
    var sql1 = `SELECT * FROM shoppinglist1 where (bookid LIKE '%${req.query.query}%') OR (orderNumber like '%${req.query.query}%') order by buyTime desc`
    mysql.query(sql1, result => {
      result[0].total = result.length
      for (var key in result) {
        result[key].buyTime = moment(result[key].buyTime).format('YYYY-MM-DD')
      }
      res.send(result)
    })
    return
  }
  if (req.query.pagenum) {
    current_page = parseInt(req.query.pagenum)
  }
  if (req.query.pagesize) {
    num = parseInt(req.query.pagesize)
  }
  var last_page = current_page - 1
  if (current_page <= 1) {
    last_page = 1
  }
  // var next_page = current_page + 1
  var str = 'SELECT * FROM shoppinglist1 order by buyTime desc limit ' + num + ' offset ' + num * (current_page - 1)
  mysql.query(str, result => {
    // console.log(result.length)
    mysql.query(sql, result1 => {
      result[0].total = result1[0]['COUNT(*)']
      for (var key in result) {
        result[key].buyTime = moment(result[key].buyTime).format('YYYY-MM-DD')
      }
      res.send(result)
    })
  })
})
// 删除订单
pcrouter.post('/pcweb/deleteorder',function(req,res) {
  var orderid = req.body.orderid
  var sql = `delete from shoppinglist1 where orderNumber = '${orderid}'`
  mysql.query(sql,result => {
    res.send({status: 502})
  })
})
module.exports = pcrouter

