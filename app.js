//set up the server
const express = require("express");
const logger = require("morgan");
const app = express();
const port = process.env.PORT || 8080;
const db = require('./db/db_connection');

// Configure Express to use EJS
app.set( "views",  __dirname + "/views");
app.set( "view engine", "ejs" );

// defines middleware that logs all incoming requests
app.use(logger("dev"));

// defines middleware that serves static resources in the public directory
app.use(express.static(__dirname + '/public'));

// configures Express to parse URL-encoded POST request bodies (traditional forms)
app.use( express.urlencoded({ extended: false }) );

// define a route for the default home page
app.get( "/", (req, res) => {
    res.render("homepage");
} );

// query to read the database information
const read_inventory_sql = `
    SELECT
        item_id,
        class_name, assignment_name, assignment_type, assignment_format,
        due_date, priority_rating, interest_level, relevance_level,
        description
    FROM
        Item
`

// define a route for the inventory page
app.get( "/inventory", (req, res) => {
    db.execute(read_inventory_sql, (error, results) => {
        if (error) {
            res.status(500).send(error); // Internal Server Error
        } else {
            res.render('inventory', {inventory : results })
        }
    });
} );

// define a route for the item detail page
const read_assignment_sql = `
    SELECT
    item_id,
    class_name, assignment_name, assignment_type, assignment_format,
    due_date, priority_rating, interest_level, relevance_level,
    description

    FROM
        Item
    WHERE
        item_id = ?
`
// define a route for the item detail page
app.get( "/inventory/details/:item_id", (req, res) => {
    db.execute(read_assignment_sql, [req.params.item_id], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else if (results.length == 0)
            res.status(404).send(`No item found with id = "${req.params.item_id}"` ); // NOT FOUND
        else {
            let data = results[0]; // results is still an array
            res.render('details', data);
        }
    });
});

// query to delete an entry on the inventory page in the table
const delete_inventory_sql = `
    DELETE
    FROM
        Item
    WHERE
        item_id = ?
`

// defines a route to delete an entry
app.get("/inventory/details/:item_id/delete", (req, res) => {
    db.execute(delete_inventory_sql, [req.params.item_id], (error, results) => {
        if (error)
            res.status(500).send(error); // Resorts to an internal server error
        else {
            res.redirect("/inventory");
        }
    });
})

// query to update entries on both the inventory and details page
const update_inventory_sql = `
    UPDATE
        Item
    SET
        class_name = ?,
        assignment_name = ?,
        due_date = ?,
        priority_rating = ?,
        assignment_type = ?,
        assignment_format = ?,
        interest_level = ?,
        relevance_level = ?,
        description = ?
    WHERE
        item_id = ?
`
// defines a POST request to update entries in the database
app.post("/inventory/details/:item_id", (req, res) => {
    db.execute(update_inventory_sql, 
    [
        req.body.class_name_input,
        req.body.assignment_name_input,
        req.body.due_date_input,
        req.body.priority_rating_input,
        req.body.assignment_type_input,
        req.body.assignment_format_input,
        req.body.interest_level_input,
        req.body.relevance_level_input,
        req.body.description_input,
        req.params.item_id
    ], (error, results) => {
        if (error)
            res.status(500).send(error);
        else {
            res.redirect(`/inventory/details/${req.params.item_id}`);
        }
    });
})

// query to create entries on the inventory page using the form
const create_inventory_sql = `
    INSERT INTO Item
        (class_name, assignment_name, due_date, priority_rating)
    VALUES
        (?, ?, ?, ?)
`

// defines a POST request to create entries in the database
app.post("/inventory", (req, res) => {
    db.execute(create_inventory_sql, [req.body.class_name, req.body.assignment_name, req.body.due_date, req.body.priority_rating], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            //results.insertId has the primary key (id) of the newly inserted element.
            res.redirect(`/inventory/details/${results.insertId}`);
        }
    });
})

// start the server
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );