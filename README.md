# RESTful API Project

CPSC 4820 - Web Development Project 5/6

Requirements:

    Run on port 3000
    Requests require basicAuth header
        username: teacher
        password: t1g3rTester!@#
        Any request without those credentials in a basicAuth header should get a 401 status code in return
    HTTP Status Codes
        if successful, 200
        if forbidden, 401
        if user error, 400
        if server error, 500
        if item not found, 404
    Things like this should all throw 404s
        PUT /students
        POST /grades/123
        DELETE /students
    POST /students
        add student
        Should accept a JSON request body

        {username: "some_username", name: "some user"}
        If no username key, no name key, or no body at all, return 400
        If username already exists as a student, return a 400
        if successful return 200 status code with a body containing a reference to the newly created item

        {"_ref":"/students/cbaker"}
    DELETE /students/:username
        delete student
        no request body required
        if no student exists, return 404
        if successful, return 200
        subsiquent requests to GET /students/:username should return a 404
    PATCH /students/:username
        modify student
        should accept a JSON request body

        {"name":"someone else"}
        should only allow name changes, not username (since thats the key)
        if try to change username, or no request body, 400
    GET /students/:username
        get student
        should return a 404 if user doesnt exist
        should return a 200 with content of json user

        {"username": "cbaker","name": "soneone else", "_ref":"/students/cbaker"}
        no queries params here
    GET /students
        get all students
        should return a JSON array. if students don't exist, still return a status 200 with []
        otherwise, return a indexed array of user objects

        [ {"username": "cbaker","name": "soneone else", "_ref":"/students/cbaker"}, {"username": "cbaker1","name": "soneone else", "_ref":"/students/cbaker1"}, {"username": "cbaker2","name": "soneone else", "_ref":"/students/cbaker2"} ]
    POST /grades
        add grade
        Should accept a JSON request body

        { "username": "some_username", "type": "quiz", "max": "12", "grade": "12" }
        If any of the 4 keys are missing, or no body at all, return 400
        if successful return 200 status code with a body containing a reference to the newly created item

        {"_ref":"/grades/2"}
        Doesn't need to care if student doesn't exist, make item anyway
    GET /grades/:gradeid
        get grade
        should return a 404 if gradeid doesn't exist
        should return a 200 with a full grade object and _ref

        { "username": "some_username", "type": "quiz", "max": "12", "grade": "12", "_ref": "/grades/2" }
    PATCH /grades/:gradeid
        modify grade
        should return a 404 if gradeid doesn't exist
        should return a 400 if request body is missing, or if no keys exist in the hash
        should expect a hashed array of values to change

        { "max": "11", "grade": "13" }
        should only accept changes for max, grade, type and username
        if change(s) successful, return a 200 with no body necessary
    DELETE /grades/:gradeid
        delete grade
        should return a 404 if gradeid doesn't exist
        should return a 200 if successfully deleted
    GET /grades
        return a list of all grades, possibly sorted based on 1 and/or two query parameters
        if no grades exist, return a 200 with a body of []
        if grades exist and no GET parameter queries were submitted, return a 200 with a list of all grade objects

        [ { "username": "some_username", "type": "quiz", "max": "12", "grade": "12", "_ref": "/grades/2" }, { "username": "some_username1", "type": "quiz", "max": "121", "grade": "12", "_ref": "/grades/3" } ]
        should accept query parameters username and type
            GET /grades?username=rusername
                filters list down to only grades matching given username
            GET /grades?type=quiz
                filters list down to only grades matching given type
            GET /grades?username=rusername&type=quiz
                filters list down to only grades matching given username AND type
    DELETE /db
        should blow away entire database of all data
        should return a 200 with no response body
        
        
Make these changes to your (or my) project 5:

    every student and grade object needs a 'id' key. For students, id=username, for grades, id should already be there
    for GET /grades and GET /students, always return a X-Total-Count header containg the total number of items before any filtering, sorting or pagination. Whenever you send 'X-Total-Count' you will also need to send the header 'Access-Control-Expose-Headers': 'X-Total-Count'
    all PATCHes should be changed to PUTs
    PUTs must now return a full version of the object after it's changed, looking like the return of a GET /students/:username
    change port it listens on to 3001 (react will run on 3000). Remember your AWS Security Group
    implement sorting
        if query param '_sort' exists, it should be an attribute name like 'type'
        if query param '_order' exists and is equal to 'asc', sort the results in ascending order by the attr listed in '_sort'. If '_order' does not exist or is not equal to 'asc', sort in descending order
    implement pagination>
        if query param '_start' or query param '_end' exists, try to paginate
        if paginating and '_start' does not exist, default _start to 0
        if paginating and '_end' doesn't exist and '_limit' exists, set '_end' to '_start' + '_limit'
        if paginating and '_end' doesn't exist and '_limit' doesn't exist set '_end' to the number of items after filtering
        use Array.slice(_start, _end) on the list of items post filtering, and return that resulting array

use notes for 10.23.17 to install yarn, react, create-react-app, and admin-on-rest
use admin-on-rest tutorial to get started
admin-on-rest app must:

    talk to your rest api on port 3001 (hard code IP of your AWS instance, or use a DNS entry)
    implement all the major actions for grades and students (list, create, edit, delete)
    sort and filter students on username and name attributes
    sort and filter grades on username, type, grade, and max attributes
    show a login page to collect the basic auth credentials required to talk to the API
        
