var express = require('express');
var bodyParser = require('body-parser');
var auth = require('basic-auth');
var redis = require('redis');
var bluebird = require('bluebird');
var cors = require('cors');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

var app = express();
app.use(bodyParser.json());
var client = redis.createClient(); //creates a new client
//allow the API to be loaded from an application running on a different host/port

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Total-Count");
	res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, PUT");
	next();
});

//make sure client connects correctly.
client.on("error", function (err) {
    console.log("Error in redis client.on: " + err);

});

var authenticate = function(req){
	var credentials = auth(req);
	if (!credentials || credentials.name !== 'teacher' || credentials.pass !== 't1g3rTester!@#') {
		return false;
	}
	return true;
};

app.get('/students/:username',function(req,res){

	//get student
	if(!authenticate(req)){
		res.status(401);
		res.end();
		return;
	}

	var username = req.params.username;
	//do a redis lookup for the hash associated with a given username
	client.hgetallAsync("student:"+username).then(function(data){
		if(!data){
			res.status(404);
			res.end();
			return;
		}

		//otherwise send requested data back
		res.status(200).json({
			username: data.username,
			name: data.name,
			id: data.id,
			_ref: "/students/"+data.username
		});
	}).catch(function(err){
		res.status(500).json({
			error: err
		});
	});
});

app.get('/students', cors(),function(req,res){

	if(!authenticate(req)){
		res.status(401);
		res.end();
		return;
	}

	//get contents of set of usernames
	client.smembersAsync('students').then(function(students){
		var promises = [];
		var studentObjs = [];

		var studentHandler = (studentName,studentObj) => {
			if(!studentObj){
				throw "unknown student'"+studentName+"'.";
			}
			studentObj._ref = "/students/"+studentName;
			studentObjs.push(studentObj);
		};


		for(var i = 0;i<students.length;i++){
			//get the hash for that username, use studentHandler to save hash into studentObjs
			//add resulting promise to promises array so we can promise.all later
			promises.push(client.hgetallAsync("student:"+students[i]).then(studentHandler.bind(null,students[i])));

		}

		//when all the hash lookups have returned and studentHandler has finished for every lookup

		Promise.all(promises).then(function(){
			//filter on name
			if(req.query.name){

				studentobjs = studentObjs.filter(function(obj){
					return obj.name.toLowerCase().indexOf(req.query.name.toLowerCase()) !== -1;
				});
			}
			//filter on username
			if(req.query.username){
				studentObjs = studentObjs.filter(function(obj){
					return obj.username.toLowerCase().indexOf(req.query.username.toLowerCase()) !== -1;
				});
			}

			if(req.query._sort == 'username'){
				if(req.query._order == 'ASC'){
					studentObjs = studentObjs.sort((a,b) => a.username.localeCompare(b.username));
				}else{
					studentObjs = studentObjs.sort((a,b) => b.username.localeCompare(a.username));
				}
			}else if(req.query._sort == 'name'){
                                if(req.query._order == 'ASC'){
                                        studentObjs = studentObjs.sort((a,b) => a.name.localeCompare(b.name));
                                }else{
                                        studentObjs = studentObjs.sort((a,b) => b.name.localeCompare(a.name));
                                }
                        }

			if(req.query._start || req.query._end){
				var start, end;
				if(req.query._start){
					start = req.query._start;
				}else{
					start = 0;
				}
				if(req.query._end){
					end = req.query._end;
				}else if(req.query._limit){
					end = req.query._start + req.query._limit;
				}else{
					end = studentObjs.length;
				}
				studentObjs = studentObjs.slice(start, end);
			}

			//return results
			res.header("Access-Control-Expose-Headers", "X-Total-Count");
			res.header("X-Total-Count", students.length);
			res.status(200).json(studentObjs);
		}).catch(function(err){
			res.status(500).json(err);
		});
	}).catch(function(err){
		res.status(500).json({
			error: err
		});
	});
});


app.post('/students',function(req,res){
	//add student
	if(!authenticate(req)){
		res.status(401);
		res.end();
		return;
	}

	if(!req.body){
		res.status(400).json({
			error: "No request body"
		});
		return;
	}


	if(!req.body.username){
		res.status(400).json({
			error: "No username"
		});
		return;
	}

	if(!req.body.name){
		res.status(400).json({
			error: "No name"
		});
		return;
	}



	var username = req.body.username;
	var name = req.body.name;

	//add username to set stored in redis key 'students'

	client.saddAsync('students', username).then(function(worked){
		if(!worked){
			res.status(400).json({
				error: "username already exists"
			});
			return;
		}

		client.hmsetAsync('student:'+username,{
			username: username,
			name: name,
			id: username
		}).then(function(worked){

			if(!worked){
				res.status(500).json({
					error: "couldn't save student."
				});
				return;
			}
			res.status(200).json({
				username: username,
				name: name,
				id: username,
				_ref: "/students/"+username
			});
		});
	});
});

app.delete('/students/:username',function(req,res){
	if(!authenticate(req)){
		res.status(401);
		res.end();
		return;
	}

	//delete username from set and delete the hash for that username
	Promise.all([
		client.delAsync("student:"+req.params.username),
		client.sremAsync("students",req.params.username)
	]).then(function(){
		res.status(200).json({});
		res.end();
	}).catch(function(err){
		res.status(500).json({
			error: err
		});
	});
});

app.put('/students/:username',function(req,res){
	if(!authenticate(req)){
		res.status(401);
		res.end();
		return;
	}
	if(!req.body){
		res.status(400).json({
			error: "missing body"
		});
		return;
	}
	if(!req.body.username && !req.body.name){
                res.status(400).json({
                        error: "missing body"
                });
                return;
        }
	if(!req.params.username){
		res.status(400).json({
			error: "username required in path"
		});
		return;
	}

	var studentupdate = {};

        if(req.body.username){
                studentupdate.username = req.body.username;
        }
        if(req.body.name){
                studentupdate.name = req.body.name;
        }

        client.hexistsAsync("student:"+req.params.username, "username").then(function(exists){
                if(exists === 0){
                        res.status(404);
                        res.end();
                        return;
                }

                //else grade exists, update the object
                client.hmsetAsync("student:"+req.params.username, studentupdate).then(function(){
                        client.hgetallAsync("student:"+req.params.username).then(function(data){
                        res.status(200).json(data);
                        res.end();
                        });
                }).catch(function(){
                        res.status(500).json({
                                error: "error saving grade"
                        });
                });
        }).catch(function(){
                res.status(500).json({
                        error: "error checking to see if grade "+req.params.gradeid+" exists"
                });
        });
});



app.post('/grades',function(req,res){
	//add grade
	if(!authenticate(req)){
		res.status(401);
		res.end();
		return;
	}


	if(!req.body){
		res.status(400).json({
			error: "missing body"
		});
		return;
	}
	if(!req.body.username || !req.body.grade || 
		!req.body.max || !req.body.type){
		res.status(400).json({
			error: "all fields are required (username, grade, max, type)"
		});
		return;
	}


	client.incrAsync("grades").then(function(id){
		var grade = {
			username: req.body.username,
			grade: req.body.grade,
			max: req.body.max,
			type: req.body.type,
			id: id

		};

		//save grade into hash
		client.hmsetAsync("grade:"+id,grade).then(function(){
			grade._ref = "/grades/"+id;

			res.status(200).json(grade);

		}).catch(function(err){
			res.status(500).json({
				error: err
			});
		});
	}).catch(function(err){
		res.status(500).json({
			error: err
		});
	});
});

app.get('/grades/:gradeid',function(req,res){

	//get grade
	if(!authenticate(req)){
		res.status(401);
		res.end();
		return;
	}



	//retrieve the hash using the ID

	client.hgetallAsync("grade:"+req.params.gradeid).then(function(data){
		res.status(200).json(data);
	}).catch(function(err){
		res.status(404);
		res.end();
	});
});

app.put('/grades/:gradeid',function(req,res){
	//modify grade
	if(!authenticate(req)){
		res.status(401);
		res.end();
		return;
	}

	if(!req.body){
		res.status(400).json({
			error: "missing body"
		});
	}

	//need a body and need at least 1 thing to change

	if(!req.body.username && !req.body.grade && 
		!req.body.max && req.body.type){
		res.status(400).json({
			error: "missing body"
		});
		return;
	}



	//build up the attrs to edit

	var grade = {};
	if(req.body.username){
		grade.username = req.body.username;
	}
	if(req.body.max){
		grade.max = req.body.max;
	}
	if(req.body.grade){
		grade.grade = req.body.grade;
	}
	if(req.body.type){
		grade.type = req.body.type;
	}

	//make sure grade exists before trying to modify it
	client.hexistsAsync("grade:"+req.params.gradeid, "grade").then(function(exists){
		//if grade doesnt exist
		if(exists === 0){
			res.status(404);
			res.end();
			return;
		}

		//else grade exists, update the object
		client.hmsetAsync("grade:"+req.params.gradeid, grade).then(function(){
			client.hgetallAsync("grade:"+req.params.gradeid).then(function(data){
			res.status(200).json(data);
			res.end();
			});
		}).catch(function(){
			res.status(500).json({
				error: "error saving grade"
			});
		});
	}).catch(function(){
		res.status(500).json({
			error: "error checking to see if grade "+req.params.gradeid+" exists"
		});
	});
});

app.delete('/grades/:gradeid',function(req,res){
	//delete grade
	if(!authenticate(req)){
		res.status(401);
		res.end();
		return;
	}

	//delete the hash

	client.delAsync("grade:"+req.params.gradeid).then(function(result){
		//if hash doesn't exist, 404
		if(result === 0){
			res.status(404);
			res.end();
			return;
		}
		res.status(200).json({});
		res.end();
	}).catch(function(){
		res.status(500);
		res.end();
	});
});


app.get('/grades', cors(), function(req,res){

	//get all grades
	//get grades by username
	//get grades by type
	//get grades by username & type

	if(!authenticate(req)){
		res.status(401);
		res.end();
		return;
	}

	//get the counter
	client.getAsync("grades").then(function(counter){
		//if no counter, no grades exist
		if(!counter || counter === 0){
			res.status(200).json([]);
			return;
		}

		var promises = [];
		var grades = [];

		var gradeHandler = function(gradeid, grade){
			if(grade !== null){
				grade.id = gradeid;
				grades.push(grade);
			}
		};



		//use counter to loop through all possible grade ids
		for(var i = 1;i<=counter;i++){
			promises.push(client.hgetallAsync("grade:"+i).then(gradeHandler.bind(null,i)));
		}

		Promise.all(promises).then(function(){
			var filters = ["username", "type"];
			var gradelength = grades.length;
			grades = grades.filter(function(grade){
				for(var i = 0;i<filters.length;i++){

					var param = filters[i];
					if( req.query[param] && req.query[param].toLowerCase() !== grade[param].toLowerCase()){
						return false;
					}
				}
				return true;

			});
			if(req.query._sort == 'username'){
                                if(req.query._order == 'ASC'){
                                        grades = grades.sort((a,b) => a.username.localeCompare(b.username));
                                }else{
                                        grades = grades.sort((a,b) => b.username.localeCompare(a.username));
                                }
                        }else if(req.query._sort == 'type'){
                                if(req.query._order == 'ASC'){
                                        grades = grades.sort((a,b) => a.type.localeCompare(b.type));
                                }else{
                                        grades = grades.sort((a,b) => b.type.localeCompare(a.type));
                                }
                        }else if(req.query._sort == 'max'){
                                if(req.query._order == 'ASC'){
                                        grades = grades.sort(function(a,b){return a.max-b.max});
                                }else{
                                        grades = grades.sort(function(a,b){return b.max-a.max});
                                }
                        }else if(req.query._sort == 'grade'){
                                if(req.query._order == 'ASC'){
                                        grades = grades.sort(function(a,b){return a.grade-b.grade});
                                }else{
                                        grades = grades.sort(function(a,b){return b.grade-a.grade});
                                }
                        }

                        if(req.query._start || req.query._end){
                                var start, end;
                                if(req.query._start){
                                        start = req.query._start;
                                }else{
                                        start = 0;
                                }
                                if(req.query._end){
                                        end = req.query._end;
                                }else if(req.query._limit){
                                        end = req.query._start + req.query._limit;
                                }else{
                                        end = studentObjs.length;
                                }
                                grades = grades.slice(start, end);
                        }
			res.header("Access-Control-Expose-Headers", "X-Total-Count");
                        res.header("X-Total-Count", gradelength);
			res.status(200).json(grades);
		}).catch(function(err){
			res.status(500).json({error: err});
		});
	});
});

app.delete('/db',function(req,res){
	client.flushallAsync().then(function(){
		res.status(200).end();
	}).catch(function(err){
		res.status(500).json({error: err});
	});
});



var port = 3001;

app.listen(port, function () {
  console.log('Example app listening on port '+port+'!');
});
