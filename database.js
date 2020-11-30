const { Pool } = require('pg');
const connectionString = 'postgres://xdmcrozh:R4425J_UiEoUDiQ41YXYpwYAS0Ln5Glw@john.db.elephantsql.com:5432/xdmcrozh'
const pool = new Pool({
  connectionString,
})

/**
 * ========================== RESET Function =========================
 */

function resetTables() {
  const sql = "DELETE FROM customerqueue; DELETE FROM companyqueue;";
  return new Promise((resolve, reject) => {
    pool
      .query(sql)
      .then(function (result) {
        resolve(null, result);
      })
      .catch(function (error) {
        reject(error, null);
      });
  })
}

/**
 * ========================== COMPANY =========================
 */

/**
 * Company: Create Queue Function
 */
function createQueue(queueID, companyID, callback) {
  const sql = "INSERT INTO companyqueue (queue_id, company_id, status) Values (UPPER($1), $2, 'INACTIVE')";
  pool
    .query(sql, [queueID, companyID])
    .then(function (result) {
      callback(null, result);
    })
    .catch(function (error) {
      callback(new Error("QUEUE_EXISTS"), null);
    });
}

/**
 * Company: Update Queue Function
 */
function updateQueue(status, queue_id, callback) {
  const sql_check = "SELECT 1 FROM companyqueue WHERE queue_id = UPPER($1)";
  var sql = "";
  if (status == 'ACTIVATE') {
    sql = "UPDATE companyqueue SET status = 'ACTIVE' WHERE queue_id = UPPER($1)";
  } else if (status == 'DEACTIVATE') {
    sql = "UPDATE companyqueue SET status = 'INACTIVE' WHERE queue_id = UPPER($1)";
  }
  if (callback) {
    pool
      .query(sql_check, [queue_id])
      .then(function (result) {
        if (result.rows.length == 1) {
          pool
            .query(sql, [queue_id])
            .then(function (results) {
              callback(null, results);
            })
            .catch(function (error) {
              callback(error, null);
            });
        } else {
          callback(new Error("UNKNOWN_QUEUE"), null);
        }

      })
      .catch(function (error) {
        callback(error, null);
      });
  }
}

/**
 * Company: Server Available Function
 */
function serverAvailable(queue_id, callback) {
  const sql_checkQueue = "SELECT 1 FROM companyqueue WHERE queue_id = UPPER($1)";
  const sql_checkCust = "SELECT customer_id FROM customerqueue WHERE fk_queue_id = UPPER($1)";
  const sql = "DELETE FROM customerqueue WHERE fk_queue_id = UPPER($1) AND customer_id = $2";
  if (callback) {
    pool
      .query(sql_checkQueue, [queue_id])
      .then(function (queue) {
        if (queue.rows.length == 1) {
          pool
            .query(sql_checkCust, [queue_id])
            .then(function (customer) {
              if (customer.rows.length > 0) {
                pool
                  .query(sql, [queue_id, customer.rows[0].customer_id])
                  .then(function (results) {
                    callback(null, customer.rows[0].customer_id, results.rowCount);
                  })
                  .catch(function (error) {
                    callback(error, null, null);
                  })
              } else {
                callback(null, customer.rows.length, null);
              }
            })
            .catch(function (error) {
              callback(error, null, null);
            })
        } else {
          callback(new Error("UNKNOWN_QUEUE"), null, null);
        }
      })
      .catch(function (error) {
        callback(error, null, null);
      });
  }
}

/**
 * Company: Arrival Rate Function
 */
function arrivalRate(queue_id, from, duration, callback) {
  const sql = "SELECT 1 FROM companyqueue WHERE queue_id = UPPER($1)";
  var from_epoch = ((new Date(from)).getTime()) / 1000;
  var to_epoch = from_epoch + (duration * 60);
  const sql2 = "SELECT timestamp, COUNT(customer_id) FROM customerQueue WHERE fk_queue_id = UPPER($1) AND timestamp <= $3 AND timestamp >= $2 GROUP BY timestamp;";
  if (callback) {
    pool
      .query(sql, [queue_id])
      .then(function (result) {
        if (result.rows.length == 1) {
          pool
            .query(sql2, [queue_id, from_epoch, to_epoch])
            .then(function (results) {
              callback(null, results.rows);
            })
            .catch(function (error) {
              callback(error, null);
            })
        } else {
          callback(new Error("UNKNOWN_QUEUE"), null);
        }
      })
      .catch(function (error) {
        callback(error, null);
      });
  }
}

/**
 * ========================== CUSTOMER =========================
 */

/**
 * Customer: Join Queue Function
 */
function joinQueue(customer_id, queue_id, callback) {
  const sql_check = "SELECT status FROM companyqueue WHERE queue_id = UPPER($1)";
  const sql = "INSERT INTO customerQueue (customer_id, fk_queue_id) VALUES ($1, UPPER($2))";
  if (callback) {
    pool
      .query(sql_check, [queue_id])
      .then(function (result) {
        if (result.rows.length == 1) {
          if (result.rows[0].status == "ACTIVE") {
            pool
              .query(sql, [customer_id, queue_id])
              .then(function (results) {
                callback(null, results);
              })
              .catch(function (error) {
                callback(error, null);
              });
          } else {
            callback(new Error("INACTIVE_QUEUE"), null);
          }
        } else {
          callback(new Error("UNKNOWN_QUEUE"), null);
        }
      })
      .catch(function (error) {
        callback(error, null);
      });
  }
}

/**
 * Customer: Check Queue Function
 */
function checkQueue(queue_id, customer_id, callback) {
  const sql_check = "SELECT status FROM companyqueue WHERE queue_id = UPPER($1)"
  const sql = "SELECT * FROM customerQueue WHERE fk_queue_id = UPPER($1);";
  if (callback) {
    pool
      .query(sql_check, [queue_id])
      .then(function (result) {
        if (result.rows.length == 1) {
          pool
            .query(sql, [queue_id])
            .then(function (results) {
              var ahead = 0;
              for (let i = 0; i < results.rows.length; i++) {
                if (results.rows[i].customer_id != customer_id) {
                  ahead++;
                } else {
                  break;
                }
              }
              // customer id not in queue
              if (ahead == results.rows.length) {
                ahead = -1;
              }
              callback(null, results.rows.length, result.rows[0].status, ahead);
            })
            .catch(function (error) {
              callback(error, null, null, null);
            })
        } else {
          callback(new Error("UNKNOWN_QUEUE"), null, null, null);
        }
      })
      .catch(function (error) {
        callback(error, null, null, null);
      });
  }
}

//Close Database Connections Function
function closeDatabaseConnections() {
  /**
   * return a promise that resolves when all connection to the database is successfully closed, and rejects if there was any error.
   */
  return new Promise((resolve, reject) => {
    pool.end()
      .then(function () {
        resolve();
      })
      .catch(function (error) {
        reject(error, null);
      });
  })
}

module.exports = {
  resetTables,
  createQueue,
  updateQueue,
  serverAvailable,
  arrivalRate,
  joinQueue,
  checkQueue,
  closeDatabaseConnections
};
