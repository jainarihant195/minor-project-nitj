const mysql = require('mysql');
const express = require('express');
const session = require('cookie-session');
const path = require('path');
const dotenv = require("dotenv").config();
const { v4: uuidv4 } = require('uuid');
var flash = require('connect-flash');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var fetchuser = require('./middleware/fetchuser');
const JWT_SECRET = 'KingKohli';
const router = express.Router();
const { Console } = require('console');
const QRCode = require('qrcode');
const QrScanner = require('qr-scanner');

var ls = require('local-storage');

const connection = mysql.createConnection(process.env.URI);
// const connection = mysql.createConnection({
// 	host: process.env.HOST,
// 	user: process.env.DATABASE_USER,
// 	password: process.env.PASSWORD,
// 	database: process.env.DATABASE,
// 	port: process.env.PORT,
// }
// );

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


// http://localhost:3000/->No login Required
app.get('/', function (request, response) {
	// ls.removeItem("currenthostel");
	// ls.removeItem("currentadmin");
	// ls.removeItem("currentgate");
	// ls.removeItem("currentuser");
	// Render login template
	// response.sendFile(path.join(__dirname + '/index.html'));
	response.sendFile(path.join(__dirname + '/demo.html'));
});

// http://localhost:3000/slogin->No login Required
app.get('/slogin', function (request, response) {

	// ls.removeItem("currenthostel");

	// Render login template
	// response.sendFile(path.join(__dirname + '/login.html'));
	response.render(__dirname + "/demo3.ejs", { message: "" });
});
// Login Required
app.post('/shome', function (req, res) {

	let success = false;
	let roll = req.body.roll;
	let password = req.body.password;
	let user = req.body.user;
	// If there are errors, return Bad request and the errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	if (!roll || !password) {
		success = false;
		var message = "  Please Login with correct Credentials";
		return res.render(__dirname + "/demo3.ejs", { message: message });

	}

	if (roll && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT * FROM userTable WHERE roll = ?', [roll], async (error, results, fields) => {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			console.log(results);
			if (results.length === 0) {
				success = false;
				var message = "  Please Login with correct Credentials";
				return res.render(__dirname + "/demo3.ejs", { message: message });
			}
			else {
				const passwordCompare = await bcrypt.compare(password, results[0].password);
				if (!passwordCompare) {
					success = false
					var message = "  Please Login with correct Credentials";
					res.render(__dirname + "/demo3.ejs", { message: message });

				}
				else if (results.length > 0 && passwordCompare) {
					// Authenticate the user
					results.map(val => {
						console.log(val.user);
						req.session.userr = val.user;
					});
					const users1 = results[0].roll;
					const users2 = results[0].user;
					const authtoken = jwt.sign(results[0].roll, JWT_SECRET);
					success = true;
					// res.json({ success, authtoken })
					req.session.loggedin = true;

					var data = {
						name: results[0].user,
						roll: results[0].roll,
						alert:"false"

					}
					console.log(data.roll);
					res.render(__dirname + "/demo2.ejs", { data: data });

				} else {
					var message = "Please Login with correct Credentials";
					res.render(__dirname + "/demo3.ejs", { message: message });

				}
				res.end();
			}
		});
	}
	else {
		var message = "  Please Login with correct Credentials";
		res.render(__dirname + "/demo3.ejs", { message: message });
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
// http://localhhttps://github.com/kbhavana14/gatePassost:3000/signup->No login Required
app.post('/ssignup', function (request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/signup.html'));
});

//No Login Required
app.post('/register', function (req, res) {

	let roll = req.body.roll;
	let username = req.body.username;
	let password = req.body.password;
	let confirm_password = req.body.confirm_password;

	if (!(roll && password && username && confirm_password)) {
		res.status(400).send("All input is required");
		var message = "All inputs are required";
		res.render(__dirname + "/demo3.ejs", { message: message });

	}

	//If error,then return bad request;
	// const errors = validationResult(req);
	let errors = [];

	if (roll && password && confirm_password && username) {

		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT * FROM userTable WHERE roll = ?', [roll], async (error, results, fields) => {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			console.log(results)
			if (results.length > 0) {

				var message = "User already  registered";
				res.render(__dirname + "/demo3.ejs", { message: message });
				// res.redirect('/alreadyexists');
			}
			else if (password.length < 5) {
				var message = "Password should be atleast 5 characters";
				res.render(__dirname + "/demo3.ejs", { message: message });

				// res.redirect('/passnotmatched');
			}
			else if (confirm_password != password) {
				var message = "Password does not match";
				res.render(__dirname + "/demo3.ejs", { message: message });

				// res.redirect('/passnotmatched');
			}

			else {
				const salt = await bcrypt.genSalt(10);
				const secPass = await bcrypt.hash(req.body.password, salt);

				const users = {
					user: req.body.username,
					password: secPass,
					roll: req.body.roll

				}

				var sql = 'INSERT INTO userTable SET ?';
				connection.query(sql, users, function (error, results) {
					if (error) res.redirect('/slogin');

				});


				var data = {
					name: users.user,
					roll: users.roll

				}
				console.log(data.roll);
				res.render(__dirname + "/demo2.ejs", { data: data });

			}
			res.end();
		});
	}


	else {
		var message = "Please enter Username and Password!";
		res.render(__dirname + "/demo3.ejs", { message: message });
		res.end();
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
app.get('/tlogin', function (request, response) {
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

		if (username == 'mbhahostel' && password == 'mbhahostel') {
			request.session.loggedin = true;
			request.session.username = username;
			ls.set("currenthostel", username);

			// Redirect to home page
			response.redirect('/thome');

		}
		else if (username == 'mbhbhostel' && password == 'mbhbhostel') {
			request.session.loggedin = true;
			request.session.username = username;
			ls.set("currenthostel", username);
			// Redirect to home page
			response.redirect('/thome');

		}
		else if (username == 'mbhfhostel' && password == 'mbhfhostel') {
			request.session.loggedin = true;
			request.session.username = username;
			ls.set("currenthostel", username);
			// Redirect to home page
			response.redirect('/thome');

		}
		else {
			response.send('Incorrect Username and/or Password!');
		}
		response.end();
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

// http://localhost:3000/hlogin
app.get('/hlogin', function (request, response) {
	// Render login template
	// response.sendFile(path.join(__dirname + '/hlogin.html'));
	response.sendFile(path.join(__dirname + '/demo_admin.html'));
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
			ls.set("currentadmin", username);
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
app.get('/glogin', function (request, response) {
	// Render login template
	// response.sendFile(path.join(__dirname + '/glogin.html'));
	response.sendFile(path.join(__dirname + '/demo_gate.html'));
});

// http://localhost:3000/gauth
app.post('/gauth', function (request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {

		if (username == 'gate' && password == 'gate12345') {
			request.session.loggedin = true;
			request.session.username = username;
			ls.set("currentgate", username);
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
	var show = ls.get("currentuser");
	if (request.session.loggedin) {
		// Output username
		response.send('Welcome back, ' + show + '!');
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

// http://localhost:3000/->Login Required
app.get('/shome', async (request, response) => {
	// var un = ls.get("currentuser");
	// ls.removeItem("currenthostel");
	// ls.removeItem("currentgate");
	// ls.removeItem("currentadmin");
	// console.log('username is: ',un);
	// if(un==null) response.redirect('/slogin');


	// Render login template
	//response.sendFile(path.join(__dirname + '/mainStd.html'));
	// response.render(__dirname + "/mainStd.ejs", { name: un });
	try {
		console.log(request.session)


		var data = {
			name: null,
			roll: null

		}
		console.log(data.roll);
		response.render(__dirname + "/demo2.ejs", { data: data });

	}
	catch {
		response.sendFile(path.join(__dirname + '/demo3.html'));
	}

});
//Login Required
app.get('/apply', async (request, response) => {
	try {
		// Render login template
		// response.sendFile(path.join(__dirname + '/apply.html'));
		response.sendFile(path.join(__dirname + '/demo_apply.html'));
	}
	catch {
		response.sendFile(path.join(__dirname + '/demo3.html'));
	}
});

app.post('/filled', function (request, response) {

	// Render login template
	var roll = request.body.roll;
	var name = request.body.name;
	// var name = ls.get("currentuser");
	var date = request.body.date;
	var dateout = request.body.dateout;
	var section = request.body.section;
	var hostel = request.body.hostel;
	var phnum = request.body.phnum;
	var reason = request.body.reason;
	const newId = uuidv4();
	var data = {
		name: name,
		roll: roll,
		alert:"true"
	}
	//response.sendFile(path.join(__dirname + '/filled.ejs'));
	// console.log("Alert: ",data.alert);
	response.render(__dirname + "/demo2.ejs",{ data: data });
	// response.render(__dirname + "/filled.ejs", { roll: roll, name: name, date: date, section: section, hostel:hostel,phnum: phnum, reason: reason,id:newId });
	
	var details = {
		roll: roll,
		name: name,
		section: section,
		hostel: hostel,
		phnum: phnum,
		reason: reason,
		date: date,
		dateout: dateout,
		id: newId

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
	var clerk = request.body.hostel;
	console.log(auto)
	//var location = document.location;
	var sql = 'UPDATE gatepas SET status = ? where id = ?'
	connection.query(sql, ['Approved', auto], function (error, results) {
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


	var auto = request.body.daid;
	console.log(auto)
	//var location = document.location;
	var sql = 'UPDATE gatepas SET status = ? where id = ?'
	connection.query(sql, ['Declined from Clerk', auto], function (error, results) {
		if (error) throw error;
		else {
			console.log("derror")
			response.redirect("/thome");
			//res.json(result);
		}
	});
	//response.sendFile(path.join(__dirname + '/updated.html'));
	//response.render(__dirname+"/updated.html");

});

app.post('/hdecline', function (request, response) {
	// Render login template
	if (ls.get("currentadmin") == null) response.redirect('/hlogin');
	else {

		var auto = request.body.declining;
		//var location = document.location;
		var sql = 'UPDATE gatepas SET status = ? where auto = ?'
		connection.query(sql, ['declined from hod', auto], function (error, results) {
			if (error) throw error;
			else {
				response.redirect("/hhome");

			}
		});
	}

});



app.get('/status', function (request, response) {
	// Render login template
	// var un = request.body.un;
	// console.log("un=>",un,un.length)
	// connection.query('SELECT * FROM gatepas where roll=?',[un], function (err, rows) {

	// 	if (err) {
	// 		request.flash('error', err);
	// 		response.render(__dirname + "/status.ejs", { page_title: "Users - Node.js", data: '' });
	// 	} else {
	// console.log(rows);
	// response.render(__dirname + "/status.ejs", { page_title: "Users - Node.js", data: rows });
	response.render(__dirname + "/demo_status.ejs", { page_title: "Users - Node.js", data: '' });


	// });

});

app.post('/status', function (request, response) {
	// Render login template
	var un = request.body.un;
	console.log("un=>", un, un.length)
	connection.query('SELECT * FROM gatepas where roll=?', [un], function (err, rows) {

		if (err) {
			request.flash('error', err);
			response.json({ message: "Koi error aa gya", result: false });
		} else {
			console.log(rows);
			response.json({ rows, result: true });
			// response.render(__dirname + "/demo_status.ejs", { page_title: "Users - Node.js", data: '' });

		}
	});

});



app.get('/thome', function (request, response) {
	// ls.removeItem("currentgate");
	// ls.removeItem("currentadmin");
	if (ls.get("currenthostel") == null) response.redirect('/tlogin');
	else {

		// Render login template
		//response.sendFile(path.join(__dirname + '/mainTea.html'));
		connection.query('SELECT * FROM gatepas where roll IS NOT NULL', function (err, rows) {
			// connection.query('SELECT * gatepas WHERE Roll IS NOT NULL;',[''], function (err, rows) {
			console.log(rows);
			if (err) {
				request.flash('error', err);
				// response.render(__dirname + "/mainTea.ejs", { page_title: "Users - Node.js", data: '' });
				response.render(__dirname + "/demo_hostel.ejs", { page_title: "Users - Node.js", data: '' });
			} else {
				//console.log(rows);
				// response.render(__dirname + "/mainTea.ejs", { page_title: "Users - Node.js", data: rows });
				response.render(__dirname + "/demo_hostel.ejs", { page_title: "Users - Node.js", data: rows });
			}

		});
	}
});


app.get('/hhome', function (request, response) {
	// Render login template
	//response.sendFile(path.join(__dirname + '/mainhod.html'));

	// ls.removeItem("currentgate");
	// ls.removeItem("currenthostel");
	if (ls.get("currentadmin") == null) response.redirect('/hlogin');
	else {

		var val = 'hod';
		var sql = 'UPDATE gatepas SET status = ? where status = ?'
		// connection.query(sql,['',hod], function (err, rows) {
		connection.query('SELECT * FROM gatepas where roll IS NOT NULL ', function (err, rows) {

			if (err) {
				request.flash('error', err);
				response.render(__dirname + "/mainhod.ejs", { page_title: "Users - Node.js", data: '' });
			} else {
				//console.log(rows);
				// response.render(__dirname + "/mainhod.ejs", { page_title: "Users - Node.js", data: rows });
				// response.render(__dirname + "/demo_admin.ejs", { page_title: "Users - Node.js", data: rows });
				response.render(__dirname + "/demo_admin.ejs", { page_title: "Users - Node.js", data: rows });
			}

		});
	}
});

app.post('/updatehod', function (request, response) {
	if (ls.get("currentadmin") == null) response.redirect('/hlogin');
	else {

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
	}
});


app.post('/download', function (request, response) {

	// Render login template
	var auto = request.body.aid;
	//var location = document.location;
	connection.query('SELECT * FROM gatepas where id=?', [auto], function (err, rows) {
		if (err) {
			request.flash('error', err);
			response.render(__dirname + "/gate_template.ejs", { page_title: "Users - Node.js", data: '' });
		} else {
			//console.log(rows);
			// response.render(__dirname + "/mainhod.ejs", { page_title: "Users - Node.js", data: rows });
			response.render(__dirname + "/gate_template.ejs", { page_title: "Users - Node.js", data: rows });
		}
	});
	//response.sendFile(path.join(__dirname + '/updated.html'));
	//response.render(__dirname+"/updated.html");

});
app.get('/ghome', function (request, response) {
	// Render login template
	//response.sendFile(path.join(__dirname + '/maingate.html'));
	// ls.removeItem("currentadmin");
	// ls.removeItem("currenthostel");
	var val = 'gate';
	connection.query('SELECT * FROM gatepas where status is NOT NULL', function (err, rows) {

		if (err) {
			request.flash('error', err);
			// response.render(__dirname + "/maingate.ejs", { page_title: "Users - Node.js", data: '' });
			response.render(__dirname + "/demo_gate.ejs", { page_title: "Users - Node.js", data: '' });
		} else {
			//console.log(rows);
			// response.render(__dirname + "/maingate.ejs", { page_title: "Users - Node.js", data: rows });
			response.render(__dirname + "/demo_gate.ejs", { page_title: "Users - Node.js", data: rows });
			// response.render(__dirname + "/gate_template.ejs", { page_title: "Users - Node.js", data: rows });
		}

	});
});
app.get('/scan', function (request, response) {
	connection.query('SELECT * FROM gatepas where status is NOT NULL', function (err, rows) {

		if (err) {
			request.flash('error', err);
			// response.render(__dirname + "/maingate.ejs", { page_title: "Users - Node.js", data: '' });
			// response.render(__dirname + "/demo_gate.ejs", { page_title: "Users - Node.js", data: '' });
			response.sendFile(path.join(__dirname + '/demo_scan.html'));
		} else {
			//console.log(rows);
			// response.render(__dirname + "/maingate.ejs", { page_title: "Users - Node.js", data: rows });
			response.sendFile(path.join(__dirname + '/demo_scan.html'));

			// response.render(__dirname + "/gate_template.ejs", { page_title: "Users - Node.js", data: rows });
		}

	});
});

app.post('/updategate', function (request, response) {
	// Render login template
	var auto = request.body.outid;
	console.log("auto2", auto);
	//var location = document.location;
	var currentTime = new Date();
	var currentOffset = currentTime.getTimezoneOffset();
	var ISTOffset = 330;   // IST offset UTC +5:30 
	var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);
	var hoursIST = ISTTime.getHours()
	var minutesIST = ISTTime.getMinutes()
	if(minutesIST<="9") minutesIST+="0"+minutesIST;
	var time= hoursIST + ":" + minutesIST;
	var day=currentTime.getDate()+"-"+currentTime.getMonth()+"-"+currentTime.getFullYear()+" "+time;
	console.log(time,day);
	var sql = 'UPDATE gatepas SET status = ?,outtime=? where id = ?'

	connection.query(sql, ['Out',day,auto], function (error, results) {
		console.log(results);
		if (error) throw error;
		else {
			response.redirect("/ghome");
			// response.json({ results });
		}
	});
	//response.sendFile(path.join(__dirname + '/updated.html'));
	//response.render(__dirname+"/updated.html");

});
app.post('/updategate2', function (request, response) {
	// Render login template
	var auto = request.body.inid;
	console.log("auto2", auto);
	//var location = document.location;
	var currentTime = new Date();
	var currentOffset = currentTime.getTimezoneOffset();
	var ISTOffset = 330;   // IST offset UTC +5:30 
	var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);
	var hoursIST = ISTTime.getHours()
	var minutesIST = ISTTime.getMinutes()
	if(minutesIST<="9") minutesIST+="0"+minutesIST;
	var time= hoursIST + ":" + minutesIST;
	var day=currentTime.getDate()+"-"+currentTime.getMonth()+"-"+currentTime.getFullYear()+" "+time;
	console.log(time,day);
	var sql = 'UPDATE gatepas SET status = ?,intime=? where id = ?'

	connection.query(sql, ['IN',day,auto], function (error, results) {
		console.log(results);
		if (error) throw error;
		else {
			response.redirect("/ghome");
			// response.json({ results });
		}
	});
	//response.sendFile(path.join(__dirname + '/updated.html'));
	//response.render(__dirname+"/updated.html");

});
/*app.post('/updategate', function (request, response) {
	// Render login template
	var auto = request.body.outid;
	//console.log(auto)
	//var location = document.location;
	
	connection.query('UPDATE gatepas SET status = ? where id = ?', ['Approved', auto], function (error, results) {
		
		if (error) throw error;
		else {
			// response.redirect("/ghome");
			console.log(results)
			var un = request.session.username;
			console.log(un)
			
			connection.query('SELECT * FROM gatepas where roll=?', [un], function (err, rows) {
		console.log(rows)
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

});*/
//port number
app.listen(3000);
