const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require("dotenv").config();
const {v4 : uuidv4} = require('uuid')
flash = require('express-flash')
const { body, validationResult } = require('express-validator');
const bcrypt=require('bcryptjs');
var jwt = require('jsonwebtoken');
var fetchuser = require('./middleware/fetchuser');
const JWT_SECRET = 'KingKohli';
const router=express.Router();
const User=require('./models/User');



const connection = mysql.createConnection({
	host: process.env.HOST,
	user: process.env.DATABASE_USER,
	password: process.env.PASSWORD,
	database: process.env.DATABASE
});
const app = express();
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
app.use(
	session({
		resave: true,
		saveUninitialized: true,
		secret: "Gate Pass",
		cookie: { secure: false, maxAge: 14400000 },
	})
);
app.use(flash());


// http://localhost:3000/
app.get('/', function (request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/index.html'));
});

// http://localhost:3000/slogin
app.post('/slogin', function (request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/sauth', async (req, res) => {
	let success = false;
	let roll = req.body.roll;
	let password = req.body.password;
	let user=req.body.user;
	// If there are errors, return Bad request and the errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
	  return res.status(400).json({ errors: errors.array() });
	}

		if (!roll || !password) {
			success = false
			return res.status(400).json({ error: "Please try to login with correct credentials" });
		}
		
		if (roll && password) {
			// Execute SQL query that'll select the account from the database based on the specified username and password
			connection.query('SELECT * FROM userTable WHERE roll = ?', [roll], async (error, results, fields)=>{
				// If there is an issue with the query, output the error
				if (error) throw error;
				// If the account exists
				console.log(results);
				
				
				const passwordCompare = await bcrypt.compare(password, results[0].password);
				if (!passwordCompare) {
					success = false
					return res.status(400).json({ success, error: "Please try to login with correct credentials" });
				}
				else if (results.length > 0 && passwordCompare) {
					// Authenticate the user
					results.map(val => {
						console.log(val.user);
						req.session.userr = val.user;
					});
					
					
					const authtoken = jwt.sign(results[0].roll, JWT_SECRET);
					success = true;
					//res.json({ success, authtoken })

					req.session.loggedin = true;
					
					
					// Redirect to home page
					// console.log(results)
					res.redirect('/shome');
					//response.render("/shome");
				} else {
					res.send('Incorrect Username and/or Password!');
				}
				res.end();
			});
		} 
		else {
			res.send('Please enter Username and Password!');
			res.end();
		}
	
  });
  

// http://localhost:3000/auth
/*app.post('/sauth', function (request, response) {
	// Capture the input fields
	let roll = request.body.roll;
	let password = request.body.password;
	let user=request.body.user;
	// Ensure the input fields exists and are not empty
	console.log(roll);
	console.log(password);
	console.log(user);
	if (roll && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT * FROM userTable WHERE roll = ? AND password = ?', [roll, password], function (error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				results.map(val => {
					console.log(val.user);
					request.session.userr = val.user;
				});
				request.session.loggedin = true;
				
				
				// Redirect to home page
				// console.log(results)
				response.redirect('/shome');
				//response.render("/shome");
			} else {
				response.send('Incorrect Username and/or Password!');
			}
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

*/
// http://localhhttps://github.com/kbhavana14/gatePassost:3000/signup
app.post('/ssignup', function (request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/signup.html'));
});


app.post('/register',async (req,res)=>{
    
	let roll=req.body.roll;
	let username = req.body.username;
	let password = req.body.password;
	let confirm_password = req.body.confirm_password;

	
	//If error,then return bad request;
    const errors = validationResult(req);

	if (roll && password && confirm_password && username) {

		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT * FROM userTable WHERE roll = ?', [roll], async(error, results, fields)=>{
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 1) {
				res.redirect('/alreadyexists');
			} 
			else if (confirm_password != password) {
				res.redirect('/passnotmatched');
			} 
			else {
				const salt = await bcrypt.genSalt(10);
				const secPass = await bcrypt.hash(req.body.password, salt);
				
				var users = {
					user: req.body.username,
					password: secPass,
					roll:req.body.roll
				}

				var sql = 'INSERT INTO userTable SET ?';
				connection.query(sql, users, function (error, results) {
					if (error) throw error;

				});
				res.redirect('/afterreg');
			}
			res.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}


})


// http://localhost:3000/register
/*app.post('/register', function (request, response) {
	// Capture the input fields
	let roll=request.body.roll;
	let username = request.body.username;
	let password = request.body.password;
	let confirm_password = request.body.confirm_password;

	
	// Ensure the input fields exists and are not empty
	if (roll && password && confirm_password) {

		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT * FROM userTable WHERE roll = ?', [roll], function (error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				response.redirect('/alreadyexists');
			} else if (confirm_password != password) {
				response.redirect('/passnotmatched');
			} else {
				var users = {
					user: request.body.username,
					password: request.body.password,
					roll:request.body.roll
				}

				var sql = 'INSERT INTO userTable SET ?';
				connection.query(sql, users, function (error, results) {
					if (error) throw error;

				});
				response.redirect('/afterreg');
			}
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});
*/
// http://localhost:3000/tlogin
app.post('/tlogin', function (request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/tlogin.html'));
});

app.get('/afterreg', function (request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/afterreg.html'));
});
app.get('/passnotmatched', function (request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/passnotmatched.html'));
});
app.get('/alreadyexists', function (request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/alreadyexists.html'));
});

// http://localhost:3000/tauth
app.post('/tauth', function (request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {

		if (username == 'hostel' && password == 'hostel') {
			request.session.loggedin = true;
			request.session.username = username;
			// Redirect to home page
			response.redirect('/thome');

		} else {
			response.send('Incorrect Username and/or Password!');
		}
		response.end();
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

// http://localhost:3000/hlogin
app.post('/hlogin', function (request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/hlogin.html'));
});

// http://localhost:3000/hauth
app.post('/hauth', function (request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {

		if (username == 'admin' && password == 'admin') {
			request.session.loggedin = true;
			request.session.username = username;
			// Redirect to home page
			response.redirect('/hhome');

		} else {
			response.send('Incorrect Username and/or Password!');
		}
		response.end();
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

// http://localhost:3000/glogin
app.post('/glogin', function (request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/glogin.html'));
});

// http://localhost:3000/gauth
app.post('/gauth', function (request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {

		if (username == 'gate' && password == 'gate') {
			request.session.loggedin = true;
			request.session.username = username;
			// Redirect to home page
			response.redirect('/ghome');

		} else {
			response.send('Incorrect Username and/or Password!');
		}
		response.end();
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});


// http://localhost:3000/home
app.get('/home', function (request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		// Not logged in
		response.send('Please login to view this page!');
	}
	response.end();
});

// http://localhost:3000/shome
/*app.get('/shome', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		response.send('Welcome back to student main page, ' + request.session.username + '!');
	} else {
		// Not logged in
		response.send('Please login to view this page!');
	}
	response.end();
});*/

// http://localhost:3000/
app.get('/shome', function (request, response) {
	var un = request.session.userr;
	console.log(un);
	// Render login template
	//response.sendFile(path.join(__dirname + '/mainStd.html'));
	response.render(__dirname + "/mainStd.ejs", { name: un });
});
app.post('/apply', function (request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/apply.html'));
});

app.post('/filled', function (request, response) {
	// Render login template
	var roll = request.body.roll;
	var name = request.body.name;
	var date = request.body.date;
	var section = request.body.section;
	var hostel = request.body.hostel;
	var phnum = request.body.phnum;
	var reason = request.body.reason;
	const newId = uuidv4();
	console.log(newId);
	//response.sendFile(path.join(__dirname + '/filled.ejs'));
	response.render(__dirname + "/filled.ejs", { roll: roll, name: name, date: date, section: section, hostel:hostel,phnum: phnum, reason: reason,id:newId });
	var details = {
		roll: roll,
		name: name,
		section: section,
		hostel:hostel,
		phnum: phnum,
		reason: reason,
		date: date,
		id:newId

	}
	var sql = 'INSERT INTO gatepas SET ?';
	connection.query(sql, details, function (error, results) {
		if (error) throw error;
		console.log("entered in db");
	});
});

app.post('/update', function (request, response) {
	// Render login template
	var auto = request.body.aid;
	console.log(auto)
	//var location = document.location;
	var sql = 'UPDATE gatepas SET status = ? where id = ?'
	connection.query(sql, ['Gate', auto], function (error, results) {
		if (error) throw error;
		else {
			response.redirect("/thome");
			//res.json(result);
		}
	});
	//response.sendFile(path.join(__dirname + '/updated.html'));
	//response.render(__dirname+"/updated.html");

});
app.post('/tdecline', function (request, response) {
	// Render login template
	var auto = request.body.declining;
	//var location = document.location;
	var sql = 'UPDATE gatepas SET status = ? where auto = ?'
	connection.query(sql, ['Declined from teacher', auto], function (error, results) {
		if (error) throw error;
		else {
			response.redirect("/thome");
			//res.json(result);
		}
	});
	//response.sendFile(path.join(__dirname + '/updated.html'));
	//response.render(__dirname+"/updated.html");

});

app.post('/hdecline', function (request, response) {
	// Render login template
	var auto = request.body.declining;
	//var location = document.location;
	var sql = 'UPDATE gatepas SET status = ? where auto = ?'
	connection.query(sql, ['declined from hod', auto], function (error, results) {
		if (error) throw error;
		else {
			response.redirect("/hhome");

		}
	});


});



app.post('/status', function (request, response) {
	// Render login template
	// response.sendFile(path.join(__dirname + '/status.html'));
	var un = request.session.userr;
	console.log('status', un);
	connection.query('SELECT * FROM gatepas where roll=?',[un], function (err, rows) {
		
		if (err) {
			request.flash('error', err);
			response.render(__dirname + "/status.ejs", { page_title: "Users - Node.js", data: '' });
		} else {
			console.log(rows);
			response.render(__dirname + "/status.ejs", { page_title: "Users - Node.js", data: rows });
		}
		
	});
	
});

app.get('/thome', function (request, response) {
	// Render login template
	//response.sendFile(path.join(__dirname + '/mainTea.html'));
	connection.query('SELECT * FROM gatepas where roll IS NOT NULL', function (err, rows) {
	// connection.query('SELECT * gatepas WHERE Roll IS NOT NULL;',[''], function (err, rows) {
console.log(rows);
		if (err) {
			request.flash('error', err);
			response.render(__dirname + "/mainTea.ejs", { page_title: "Users - Node.js", data: '' });
		} else {
			//console.log(rows);
			response.render(__dirname + "/mainTea.ejs", { page_title: "Users - Node.js", data: rows });
		}

	});

});


app.get('/hhome', function (request, response) {
	// Render login template
	//response.sendFile(path.join(__dirname + '/mainhod.html'));
	
	var val = 'hod';
	var sql = 'UPDATE gatepas SET status = ? where status = ?'
	// connection.query(sql,['',hod], function (err, rows) {
	connection.query('SELECT * FROM gatepas where roll IS NOT NULL ', function (err, rows) {

		if (err) {
			request.flash('error', err);
			response.render(__dirname + "/mainhod.ejs", { page_title: "Users - Node.js", data: '' });
		} else {
			//console.log(rows);
			response.render(__dirname + "/mainhod.ejs", { page_title: "Users - Node.js", data: rows });
		}

	});
});

app.post('/updatehod', function (request, response) {

	// Render login template
	var auto = request.body.aid;
	//var location = document.location;
	var sql = 'UPDATE gatepas SET status = ? where id = ?'
	connection.query(sql, ['gate', auto], function (error, results) {
		if (error) throw error;
		else {
			response.redirect("/hhome");
			//res.json(result);
		}
	});
	//response.sendFile(path.join(__dirname + '/updated.html'));
	//response.render(__dirname+"/updated.html");

});


app.get('/ghome', function (request, response) {
	// Render login template
	//response.sendFile(path.join(__dirname + '/maingate.html'));
	var val = 'gate';
	connection.query('SELECT * FROM gatepas where status is NOT NULL', function (err, rows) {

		if (err) {
			request.flash('error', err);
			response.render(__dirname + "/maingate.ejs", { page_title: "Users - Node.js", data: '' });
		} else {
			//console.log(rows);
			response.render(__dirname + "/maingate.ejs", { page_title: "Users - Node.js", data: rows });
		}

	});
});

app.post('/updategate', function (request, response) {
	// Render login template
	var auto = request.body.out;
	//var location = document.location;
	var sql = 'UPDATE gatepas SET status = ?, outtime = CURRENT_TIMESTAMP where auto = ?'
	connection.query(sql, ['Approved', auto], function (error, results) {
		if (error) throw error;
		else {
			// response.redirect("/ghome");
			//res.json(result);
			var un = request.session.username;
			connection.query('SELECT * FROM gatepas where roll=?', [un], function (err, rows) {
		
				if (err) {
					request.flash('error', err);
					response.render(__dirname + "/status.ejs", { page_title: "Users - Node.js", data: '' });
				} else {
					console.log(rows);
					response.render(__dirname + "/status.ejs", { page_title: "Users - Node.js", data: rows });
				}
				
			});
		}
	});
	
	// response.sendFile(path.join(__dirname + '/updated.html'));
	// response.render(__dirname+"/updated.html");

});
//port number
app.listen(3000);
