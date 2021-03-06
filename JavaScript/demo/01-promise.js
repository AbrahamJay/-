// Promise语法：new Promise((resolve, reject) => {})
// 类
// 三个状态 pedding fulfilled rejected
// 参考Promise规范 https://promisesaplus.com/

// 定义Promise类
class Promise {
  constructor (executor) {
    this.state = 'pedding'
    this.value = undefined
    this.reason = undefined
    this.resolveCallbacks = []
    this.rejectCallbacks = []
    let resolve = value => {
      if (this.state === 'pedding') {
        this.state = 'fulfilled'
        this.value = value
        this.resolveCallbacks.map(fn => fn())
      }
    }
    let reject = reason => {
      if (this.state === 'pedding') {
        this.state = 'rejected'
        this.reason = reason
        this.rejectCallbacks.map(fn => fn())
      }
    }
    // executor报错 直接执行reject
    try {
      executor(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }
  then (onFulfilled, onRejcted) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
    onRejcted = typeof onRejcted === 'function' ? onRejcted : err => { throw err }
    let promise2 = new Promise((resolve, reject) => {
      if (this.state === 'fulfilled') {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value)
            resolvePromise(promise2, x, resolve, reject)
          } catch (error) {
            reject(error)
          }
        }, 0)
      }
      if (this.state === 'rejected') {
        setTimeout(() => {
          try {
            let x = onRejcted(this.reason)
            resolvePromise(promise2, x, resolve, reject)
          } catch (error) {
            reject(error)
          }
        }, 0)
      }
      if (this.state === 'pedding') {
        this.resolveCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x= onFulfilled(this.value)
              resolvePromise(promise2, x, resolve, reject)
            } catch (error) {
              reject(error)
            }
          }, 0)
        })
        this.rejectCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejcted(this.reason)
              resolvePromise(promise2, x, resolve, reject)
            } catch (error) {
              reject(error)
            }
          }, 0)
        })
      }
    })
    return promise2
  }
  catch (fn) {
    return this.then(null, fn)
  }
}
function resolvePromise (promise2, x, resolve, reject) {
  // 循环引用报错
  if (x === promise2) {
    return reject(new TypeError('循环调用自身'))
  }
  // 防止多次调用
  let called;
  // x不是null 且x是对象或函数
  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    try {
      // A+规定，声明then = x的then方法
      let then = x.then
      // 如果then是函数，就默认是promise了
      if (typeof then === 'function') {
        // 就让then执行 第一个参数是this 后面的是成功的回调 和 失败的回调
        then.call(x, y => {
          // 成功和失败只能调用一个
          if (called) return
          call = true
          // 递归如果返回结果依旧是promise，那就继续解析
          resolvePromise(promise2, y, resolve, reject)
        }, err => {
          if (called) return
          call = true
          reject(err)
        })
      } else {
        resolve(x)
      }
    } catch (e) {
      if (called) return
      call = true
      reject(e)
    }
  } else {
    resolve(x)
  }
}
Promise.resolve = function (val) {
  return new Promise((resolve, reject) => {
    resolve(val)
  })
}
Promise.reject = function (val) {
  return new Promise((resolve, reject) => {
    reject(val)
  })
}
Promise.race = function (promises) {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < promises.length; i++) {
      promises[i].then(resolve, reject)
    }
  })
}
Promise.all = function (promises) {
  let result = []
  let i = 0
  function processData (index, data, resolve) {
    result[index] = data
    i++
    if (i === promises.length) {
      resolve(result)
    }
  }
  return new Promise((resolve, reject) => {
    for (let i = 0; i < promises.length; i++) {
      promises[i].then(data => {
        processData(i, data, resolve)
      }, e => {
        reject(e)
      })
    }
  })
}

/* ---------------------------------------以下为测试代码------------------------------------------ */

/**
 * @desc 测试promise以及promise链式调用
 */
const test01 = new Promise((resolve, reject) => {
  if (Math.random() < 0.5) {
    setTimeout(() => {
      resolve(new Promise(function (resolve, reject) {
        setTimeout(() => {
          resolve('成功')
        }, 1000)
      }))
    }, 1000)
  } else {
    setTimeout(() => {
      reject('失败')
    }, 1000)
  }
})
console.log(test01)
let startTime = new Date().getTime()
test01.then(res => {
  console.log('success promise++++', res)
  return res
}).then(res => {
  console.log(res)
  console.log('timeout+++++', new Date().getTime() - startTime)
}).catch(err => {
  console.log(err)
  console.log('timeout+++++', new Date().getTime() - startTime)
})

/**
 * @desc 测试Promise.all
 */
let test02 = new Promise((resolve, reject) => {
  resolve('test02')
})
let test03 = new Promise((resolve, reject) => {
  resolve('test03')
})
let test04 = new Promise((resolve, reject) => {
  resolve('test04')
})
Promise.all([test02, test03, test04]).then(res => {
  console.log(res)
}).catch(err => {
  console.log(err)
})

/**
 * @desc 测试Promise.resolve
 */
// Promise.resolve('test Promise.resolve').then(res => {
//   console.log(res)
// })

/**
 * @desc 测试Promise.race (哪个结果获得的快，就返回那个结果，不管结果本身是成功状态还是失败状态)
 */
// let p1 = new Promise((resolve, reject) => {
//   setTimeout(() => {
//     resolve('success')
//   }, 1000)
// })
// let p2 = new Promise((resolve, reject) => {
//   setTimeout(() => {
//     reject('failed')
//   }, 500)
// })
// Promise.race([p1, p2]).then((result) => {
//   console.log(result)
// }).catch((error) => {
//   console.log(error)  // 打开的是 'failed'
// })