const express = require('express'); // DO NOT DELETE
const cors = require('cors');
const morgan = require('morgan');
const app = express(); // DO NOT DELETE

const database = require('./database.js');

app.use(morgan('dev'));
app.use(cors());
app.use(express.json())


/**
 * =====================================================================
 * ========================== CODE STARTS HERE =========================
 * =====================================================================
 */
/**
 * ========================== SETUP APP =========================
 */

/**
 * JSON Body
 */
const companySchema = {
    "type": "object",
    "properties": {
        "company_id": {
            "type": "integer",
            "minimum": 1000000000,
            "maximum": 9999999999
        },
        "queue_id": {
            "type": "string",
            "pattern": "^[a-zA-Z0-9]{10}$"
        }
    },
    "required": [
        "company_id",
        "queue_id"
    ]
};

const schemaUpdateStatus = {
    "type": "object",
    "properties": {
        "status": {
            "type": "string",
            "pattern": "^(ACTIVATE|DEACTIVATE)$"
        }
    },
    "required": [
        "status"
    ]
};

const schemaQueue = {
    "type": "object",
    "properties": {
        "queue_id": {
            "type": "string",
            "pattern": "^[a-zA-Z0-9]{10}$"
        }
    },
    "required": [
        "queue_id"
    ]
};

const schemaArrivalRate = {
    "type": "object",
    "properties": {
        "queue_id": {
            "type": "string",
            "pattern": "^[a-zA-Z0-9]{10}$"
        },
        "from": {
            "type": "string",
            "pattern": "^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})[+-]([0-9]{2}):([0-9]{2})$"
        },
        "duration": {
            "type": "integer",
            "minimum": 1,
            "maximum": 1440
        }
    },
    "required": [
        "queue_id",
        "from",
        "duration"
    ]
};

const joinQueueSchema = {
    "type": "object",
    "properties": {
        "customer_id": {
            "type": "integer",
            "minimum": 1000000000,
            "maximum": 9999999999
        },
        "queue_id": {
            "type": "string",
            "pattern": "^[a-zA-Z0-9]{10}$"
        }
    },
    "required": [
        "queue_id",
        "customer_id"
    ]
};

const checkQueueSchema = {
    "type": "object",
    "properties": {
        "customer_id": {
            "type": "integer",
            "minimum": 1000000000,
            "maximum": 9999999999
        },
        "queue_id": {
            "type": "string",
            "pattern": "^[a-zA-Z0-9]{10}$"
        }
    },
    "required": [
        "queue_id"
    ]
};

const jsonschema = require('jsonschema');
function isValid(instance, schema) {
    return jsonschema.validate(instance, schema).valid;
}

/**
 * ========================== RESET API =========================
 */
app.post('/reset', function (req, res) {
    database.resetTables()
        .then(function (results) {
            return res.status(200).send(results);
        }).catch(function (err) {
            res.status(500).send(error);
        });
})

/**
 * ========================== COMPANY =========================
 */

/**
 * Company: Create Queue
 */
app.post('/company/queue', function (req, res) {
    if (isValid(req.body, companySchema)) {
        database.createQueue(
            req.body.queue_id,
            req.body.company_id,
            function (err, results) {
                if (!err) {
                    res.status(201).send();
                } else if (err.message == 'QUEUE_EXISTS') {
                    res.status(422)
                    res.json({
                        "error": "Queue Id " + req.body.queue_id + " already exists",
                        "code": "QUEUE_EXISTS"
                    })
                }
            }
        )
    } else {
        res.status(400)
        res.json({
            "error": "You have an invalid json body",
            "code": "INVALID_JSON_BODY"
        })
    }
})

/**
 * Company: Update Queue
 */
app.put('/company/queue/', function (req, res) {
    if (isValid(req.body, schemaUpdateStatus)) {
        if (isValid(req.query, schemaQueue)) {
            database.updateQueue(
                req.body.status,
                req.query.queue_id,
                function (err, results) {
                    if (err == null) {
                        res.status(200).send();
                    } if (err.message == "UNKNOWN_QUEUE") {
                        res.status(404).send({
                            error: "Queue Id " + req.query.queue_id + " Not Found",
                            code: "UNKNOWN_QUEUE"
                        })
                    }
                }
            )
        } else {
            res.status(400)
            res.json({
                "error": "You have an invalid query",
                "code": "INVALID_QUERY_STRING"
            })
        }
    } else {
        res.status(400)
        res.json({
            "error": "You have an invalid json body",
            "code": "INVALID_JSON_BODY"
        })
    }
})

/**
 * Company: Server Available
 */
app.put('/company/server', function (req, res) {
    if (isValid(req.body, schemaQueue)) {
        database.serverAvailable(
            req.body.queue_id,
            function (err, customer_id, results) {
                if (results == 1) {
                    res.status(200).json({
                        customer_id: parseInt(customer_id)
                    });
                } else if (customer_id == 0) {
                    res.status(200).json({
                        customer_id: parseInt(customer_id)
                    });
                } else if (err.message == "UNKNOWN_QUEUE") {
                    res.status(404).send({
                        "error": "Queue Id " + req.body.queue_id + " Not Found",
                        "code": "UNKNOWN_QUEUE"
                    })
                }
            })
    } else {
        res.status(400).send({
            "error": "You have an invalid json body",
            "code": "INVALID_JSON_BODY"
        })
    }
})

/**
 * Company: Arrival Rate
 */
app.get('/company/arrival_rate', function (req, res) {
    req.query.duration = parseInt(req.query.duration);
    if (isValid(req.query, schemaArrivalRate)) {
        database.arrivalRate(
            req.query.queue_id,
            req.query.from,
            req.query.duration,
            function (err, results) {
                if (err == null) {
                    res.status(200).json(results);
                }
                else if (err.message == "UNKNOWN_QUEUE") {
                    res.status(404).send({
                        "error": "Queue Id " + req.query.queue_id + " Not Found",
                        "code": "UNKNOWN_QUEUE"
                    });
                }
            }
        )
    } else {
        res.status(400)
        res.json({
            "error": "You have an invalid query",
            "code": "INVALID_QUERY_STRING"
        });
    }
})

/**
 * ========================== CUSTOMER =========================
 */

/**
 * Customer: Join Queue
 */
app.post('/customer/queue/', function (req, res) {
    if (isValid(req.body, joinQueueSchema)) {
        database.joinQueue(
            req.body.customer_id,
            req.body.queue_id,
            function (err, result) {
                if (err == null) {
                    res.status(201).send();
                } else if (err.message == "UNKNOWN_QUEUE") {
                    res.status(404).send({
                        "error": "Queue Id " + req.body.queue_id + " Not Found",
                        "code": "UNKNOWN_QUEUE"
                    })
                } else if (err.message == "INACTIVE_QUEUE") {
                    res.status(422).send({
                        "error": "Queue " + req.body.queue_id + " is INACTIVE",
                        "code": "INACTIVE_QUEUE"
                    })
                } else if (err) {
                    res.status(422).send({
                        "error": "Customer " + req.body.customer_id + " already in Queue " + req.body.queue_id,
                        "code": "ALREADY_IN_QUEUE"
                    })
                }
            })
    } else {
        res.status(400).send({
            "error": "You have an invalid json body",
            "code": "INVALID_JSON_BODY"
        })
    }
})

/**
 * Customer: Check Queue
 */
app.get('/customer/queue', function (req, res) {
    if (req.query.customer_id != undefined) {
        req.query.customer_id = parseInt(req.query.customer_id);
    }
    if (isValid(req.query, checkQueueSchema)) {
        database.checkQueue(
            req.query.queue_id,
            req.query.customer_id,
            function (err, length, status, ahead) {
                if (err == null) {
                    res.status(200).send({
                        total: length,
                        ahead: ahead,
                        status: status
                    })
                } else if (err.message == "UNKNOWN_QUEUE") {
                    res.status(404).send({
                        "error": "Queue Id " + req.query.queue_id + " Not Found",
                        "code": "UNKNOWN_QUEUE"
                    })
                }
            })
    } else {
        res.status(400).send({
            "error": "You have an invalid query",
            "code": "INVALID_QUERY_STRING"
        })
    }
})

/**
 * ========================== UTILS =========================
 */

/**
 * 404
 */
app.use(function (req, res) {
    throw new Error({
        error: "not found",
        status: 404
    });
});

/**
 * Error Handler
 */
app.use(function (err, req, res) {
    const status = err.status || 500;
    const body = err.body || {
        error: err.message,
        code: "UNEXPECTED_ERROR"
    };
    res.status(status).send(body);
});

function tearDown() {
    // DO NOT DELETE
    return database.closeDatabaseConnections();
}

/**
 *  NOTE! DO NOT RUN THE APP IN THIS FILE.
 *
 *  Create a new file (e.g. server.js) which imports app from this file and run it in server.js
 */

module.exports = { app, tearDown }; // DO NOT DELETE
