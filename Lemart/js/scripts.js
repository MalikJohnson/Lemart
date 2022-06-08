/*!
* Copyright 2013-2022 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-shop-homepage/blob/master/LICENSE)
*/


var db = openDatabase("lemartDB", "1.0", "lemartDB", 65535);

$(function createUsersTable() {
    db.transaction(function (transaction) {
        var sql = "CREATE TABLE users  " +
            "(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," +
            "username varchar(100) NOT NULL," +
            "password varchar(100) NOT NULL," +
            "cartSize INT(5) NOT NULL," +
            "total decimal(10,2) NOT NULL)";
        transaction.executeSql(sql, undefined, function () {
        }, function (transaction, err) {
            //alert(err.message);
        })
    });

})


//create items table
$(function createItemTable() {
    db.transaction(function (transaction) {
        var sql = "CREATE TABLE items  " +
            "(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," +
            "name varchar(100) NOT NULL," +
            "users_id INT(5)," +
            "price decimal(10,2) NOT NULL," +
            "itemQuantity INT(5) NOT NULL," +
            "imagePath varchar(255) NOT NULL," +
            "category varchar(100) NOT NULL," +
            "FOREIGN KEY (users_id) REFERENCES users(id) ON DELETE CASCADE)";
        transaction.executeSql(sql, undefined, function () {
        }, function (transaction, err) {
            // alert(err.message);
        })
    });

})


//Get value of cookie
function cookieVal(cookieName) {
    var thisCookie = document.cookie.split("; ");

    for (var i = 0; i < thisCookie.length; i++) {
        if (cookieName == thisCookie[i].split("=")[0]) {
            return thisCookie[i].split("=")[1];
        }
    }
    return 0;
}

//Updates the cart amount for a given id
function updateCart(id) {
    let cartAmount = 0;
    db.transaction(test => {
        test.executeSql("SELECT SUM(itemQuantity) FROM ITEMS WHERE users_id = ?", [id], function (transaction, result) {
            if (result.rows.length) {
                let row = result.rows.item(0);
                cartAmount = row["SUM(itemQuantity)"];
                $("#cartNumber").text(cartAmount);
                //return cartAmount;
            }
        });

    });
}

function reloadCart() {
    let user = cookieVal("username");
    let userId = 0;
    let cartAmount = 0;
    db.transaction(t => {
        t.executeSql("SELECT id FROM users WHERE username = ?", [user], function (transaction, result) {
            if (result.rows.length) {
                let row = result.rows.item(0);
                userId = row.id;
            }
        });
        if (user !== null && user != 0) {
            db.transaction(test => {
                test.executeSql("SELECT SUM(itemQuantity) FROM ITEMS WHERE users_id = ?", [userId], function (transaction, result) {
                    if (result.rows.length) {
                        let row = result.rows.item(0);
                        cartAmount = row["SUM(itemQuantity)"];
                        $("#cartNumber").text(cartAmount);
                        //return cartAmount;
                    }
                });

            });
        }
        else if (user == null || user == "" || user == 0) {
            $("#cartNumber").text(0);
        }
    });


}


function deleteButton(itemName, id) {
    $("#itemlist").children().remove();
    let itemAmount = 0;
    db.transaction(t => {
        t.executeSql("SELECT itemQuantity FROM items WHERE users_id = ? AND name = ?", [id, itemName], function (transaction, result) {
            if (result.rows.length) {
                let row = result.rows.item(0);
                //If itemQuantity is 0 or 1 delete it from the cart on subtract 1
                itemAmount = row.itemQuantity - 1;
                if (itemAmount == 0) {
                    db.transaction(function (transaction) {
                        //DELETE FROM items WHERE name=? AND users_id=? ;
                        var sql = "DELETE FROM items WHERE name=? AND users_id=? ;";
                        transaction.executeSql(sql, [itemName, id], function () {
                            // $("#itemlist").children().remove();
                            updateCart(id);
                            //displayCart();
                            return 0;
                        })
                    })
                }
                //itemAmount = row.itemQuantity - 1;

                db.transaction(t2 => {
                    if (itemAmount > 0)
                        t2.executeSql("UPDATE items SET itemQuantity = ? WHERE users_id = ? AND name = ?", [itemAmount, id, itemName]);
                    updateCart(id);
                    displayCart();
                    return 0;
                });
            }
        });
    });
}

function subtract(name) {
    let userId = 0;
    let user = cookieVal("username");
    let itemName = name;
    db.transaction(t => {
        t.executeSql("SELECT id FROM users WHERE username = ?", [user], function (transaction, result) {
            if (result.rows.length) {
                let row = result.rows.item(0);
                userId = row.id;
                deleteButton(itemName, userId);
            }
        });

    });
}

//Display cart function
function displayCart() {
    $("#itemlist").children().remove();
    var userId = 0;
    var user = cookieVal("username");
    let grandTotal = 0;
    db.transaction(t => {
        t.executeSql("SELECT id FROM users WHERE username = ?", [user], function (transaction, result) {
            if (result.rows.length) {
                let row = result.rows.item(0);
                userId = row.id;
            }
        });

    });

    db.transaction(t => {
        t.executeSql("SELECT * FROM items WHERE users_id = ?", [userId], function (transaction, result) {
            if (result.rows.length) {
                for (var i = 0; i < result.rows.length; i++) {
                    var row = result.rows.item(i);
                    var item = row.imagePath;
                    let name = row.name;
                    var img = '<img src="' + item + '" title="' + name + '" alt="' + name + '" width="100" height="100"/>';
                    var price = row.price;
                    var quantity = row.itemQuantity;
                    let subtractButton = document.createElement("button");
                    subtractButton.innerHTML = "Subtract";
                    subtractButton.type = "button";
                    subtractButton.className = "btn btn-outline-dark mt-auto subtractButton";
                    subtractButton.id = name;
                    subtractButton.onclick = function () { subtract(name) };
                    grandTotal = grandTotal + Math.round(price * quantity * 1e2) / 1e2;
                    grandTotal = Math.round(grandTotal * 1e2) / 1e2;
                    let this_div = document.getElementById('itemlist');
                    this_div.insertAdjacentHTML('beforeend', '<tr><td>' + img + '</td><td>' + name + '</td><td>' + "$" + price + '<br>' + "x" + quantity + '<br>' + "$" + (price * quantity).toFixed(2) + '</td></tr>');
                    document.getElementById('itemlist').appendChild(subtractButton);
                }
                let lastRow = document.getElementById('itemlist');
                lastRow.insertAdjacentHTML('beforeend', '<tr><td>' + '</td><td>' + '</td><td>' + "Grand Total" + '<br>' + "$" + grandTotal + '</td></tr>');
            } else {
                $("#itemlist").append('<tr><td colspan="3" align="center">No Item found</td></tr>');
            }
        });

    });
}

function testUser() {
    let username = "test"
    let password = "test"
    let userExist = false;

    db.transaction(t => {
        t.executeSql("SELECT * FROM users WHERE username = ?", [username], function (transaction, result) {
            if (result.rows.length) {
                let row = result.rows.item(0);
                let dataUserName = row.username;
                if (username === dataUserName) {
                    // alert("Username is already in use " + username);
                    userExist = true;
                    return;
                }
            }
            else {
                //transaction for creating user if user isn't in database
                db.transaction(function (transaction2) {
                    let sql = "INSERT INTO users(username,password,cartSize,total) VALUES(?,?,?,?)";
                    transaction2.executeSql(sql, [username, password, 0, 0], function () {
                        document.cookie = "username=" + username;
                        document.cookie = "login=" + true;
                        //alert("User has been created.");
                    })
                })
            }
        });
    });
}

$(document).ready(function () {
    $(".subtractButton").click(function () {
        let userId = 0;
        let user = cookieVal("username");
        let itemName = this.id;
        db.transaction(t => {
            t.executeSql("SELECT id FROM users WHERE username = ?", [user], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    userId = row.id;
                    deleteButton(itemName, userId);
                }
            });

        });
    })
    //Create test user
    testUser();
    //update cart on reload
    reloadCart();
    //display cart
    var path = window.location.pathname;
    var page = path.split("/").pop();
    if(page=="cart.html")
    {
        displayCart();
    }
    //create user function for login page
    $("#create").click(function () {

        var username = $("#username").val();
        var password = $("#password").val();
        var userExist = false;

        let user = cookieVal("username");
        let name = ""
        let userId = 0;
        let price = 0;
        let itemAmount = 0;
        let imagePath = "";
        let category = "";

        //transaction for checking is user alreay is in database
        db.transaction(t => {
            t.executeSql("SELECT * FROM users WHERE username = ?", [username], function (transaction, result) {
                if (result.rows.length) {
                    var row = result.rows.item(0);
                    var dataUserName = row.username;
                    if (username === dataUserName) {
                        alert("Username is already in use " + username);
                        userExist = true;
                        return;
                    }
                }
                else {
                    //Transaction for creating user if user isn't in database
                    db.transaction(function (transaction2) {
                        var sql = "INSERT INTO users(username,password,cartSize,total) VALUES(?,?,?,?)";
                        transaction2.executeSql(sql, [username, password, 0, 0], function () {
                            alert("User has been created.");
                        })
                    })
                    //Transaction for user id from user
                    db.transaction(t => {
                        t.executeSql("SELECT id FROM users WHERE username = ?", [username], function (transaction, result) {
                            if (result.rows.length) {
                                let row = result.rows.item(0);
                                userId = row.id;
                            }
                        });

                    });
                    //Inserting test rows into new user based on test rows
                    db.transaction(t => {
                        t.executeSql("SELECT * FROM items WHERE users_id = ?", [1], function (transaction, result) {
                            if (result.rows.length) {
                                for (var i = 0; i < result.rows.length; i++) {
                                    let row = result.rows.item(i);
                                    let item = row.imagePath;
                                    let name = row.name;
                                    let price = row.price;
                                    let category = row.category;
                                    let quantity = row.itemQuantity;
                                    // insert transaction 
                                    db.transaction(function (transaction) {
                                        let sql = "INSERT INTO items(name,users_id,price,itemQuantity,imagePath,category) VALUES(?,?,?,?,?,?)";
                                        transaction.executeSql(sql, [name, userId, price, quantity, item, category], function () {
                                            //updateCart(userId);
                                        })
                                    })
                                }
                            }
                        });
                    });
                }
            });
        });
    })

    //Login user function for login page
    $("#login").click(function () {
        //username and password = text boxes
        var username = $("#username").val();
        var password = $("#password").val();
        //If username and password === result of query alert login in successful set login cookie to true
        db.transaction(t => {
            t.executeSql("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], function (transaction, result) {
                if (result.rows.length) {
                    var row = result.rows.item(0);
                    var dataUserName = row.username;
                    var dataPassword = row.password;
                    if (username === dataUserName && password === dataPassword) {
                        //login cookie set to true
                        //username cookie set to username
                        document.cookie = "username=" + username;
                        document.cookie = "login=" + true;
                        reloadCart();
                        alert("You have been logged in as " + username);
                    }
                }
            });

        });
    })

    // signout function for login page

    $("#signout").click(function () {
        document.cookie = "username=" + "";
        document.cookie = "login=" + "";
        reloadCart();
        alert("You have been signed out");
    })

    $("#yogurtButton").click(function () {

        let user = cookieVal("username");
        let name = "Crunch Yogurt"
        let userId = 0;
        let price = 2.99;
        let itemAmount = 0;
        let imagePath = "assets/img/yogurt.jpg";
        let category = "Dairy";
        //If user isn't signed in alert them to sign in
        if (user == null || user == "" || user == 0) {
            alert("Must sign in to add to cart");
            return 0;
        }
        //Transaction for user id from user
        db.transaction(t => {
            t.executeSql("SELECT id FROM users WHERE username = ?", [user], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    userId = row.id;
                }
            });

        });
        //Transction for itemAmount value of item if it already exist
        db.transaction(t => {
            t.executeSql("SELECT itemQuantity FROM items WHERE users_id = ? AND name = ?", [userId, name], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    itemAmount = row.itemQuantity + 1;

                    db.transaction(t2 => {
                        t2.executeSql("UPDATE items SET itemQuantity = ? WHERE users_id = ? AND name = ?", [itemAmount, userId, name]);
                        updateCart(userId);
                        alert("Item has been added to the cart.");
                        return 0;
                    });
                }
                else {
                    db.transaction(function (transaction) {
                        var sql = "INSERT INTO items(name,users_id,price,itemQuantity,imagePath,category) VALUES(?,?,?,?,?,?)";
                        transaction.executeSql(sql, [name, userId, price, 1, imagePath, category], function () {
                            updateCart(userId);
                            alert("Item has been added to the cart.");
                        })
                    })
                }
            });
        });
    })

    $("#kraftButton").click(function () {

        let user = cookieVal("username");
        let name = "Velveeta Shell Cheese"
        let userId = 0;
        let price = 4.00;
        let itemAmount = 0;
        let imagePath = "assets/img/kraftCheese.jpg";
        let category = "Dairy";
        //If user isn't signed in alert them to sign in
        if (user == null || user == "" || user == 0) {
            alert("Must sign in to add to cart");
            return 0;
        }
        //Transaction for user id from user
        db.transaction(t => {
            t.executeSql("SELECT id FROM users WHERE username = ?", [user], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    userId = row.id;
                }
            });

        });
        //Transction for itemAmount value of item if it already exist
        db.transaction(t => {
            t.executeSql("SELECT itemQuantity FROM items WHERE users_id = ? AND name = ?", [userId, name], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    itemAmount = row.itemQuantity + 1;

                    db.transaction(t2 => {
                        t2.executeSql("UPDATE items SET itemQuantity = ? WHERE users_id = ? AND name = ?", [itemAmount, userId, name]);
                        updateCart(userId);
                        alert("Item has been added to the cart.");
                        return 0;
                    });
                }
                else {
                    db.transaction(function (transaction) {
                        var sql = "INSERT INTO items(name,users_id,price,itemQuantity,imagePath,category) VALUES(?,?,?,?,?,?)";
                        transaction.executeSql(sql, [name, userId, price, 1, imagePath, category], function () {
                            updateCart(userId);
                            alert("Item has been added to the cart.");
                        })
                    })
                }
            });
        });
    })

    $("#turkeyButton").click(function () {

        let user = cookieVal("username");
        let name = "Turkey Burgers"
        let userId = 0;
        let price = 6.99;
        let itemAmount = 0;
        let imagePath = "assets/img/turkeyBurger.jpeg";
        let category = "Meat";
        //If user isn't signed in alert them to sign in
        if (user == null || user == "" || user == 0) {
            alert("Must sign in to add to cart");
            return 0;
        }
        //Transaction for user id from user
        db.transaction(t => {
            t.executeSql("SELECT id FROM users WHERE username = ?", [user], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    userId = row.id;
                }
            });

        });
        //Transction for itemAmount value of item if it already exist
        db.transaction(t => {
            t.executeSql("SELECT itemQuantity FROM items WHERE users_id = ? AND name = ?", [userId, name], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    itemAmount = row.itemQuantity + 1;

                    db.transaction(t2 => {
                        t2.executeSql("UPDATE items SET itemQuantity = ? WHERE users_id = ? AND name = ?", [itemAmount, userId, name]);
                        updateCart(userId);
                        alert("Item has been added to the cart.");
                        return 0;
                    });
                }
                else {
                    db.transaction(function (transaction) {
                        var sql = "INSERT INTO items(name,users_id,price,itemQuantity,imagePath,category) VALUES(?,?,?,?,?,?)";
                        transaction.executeSql(sql, [name, userId, price, 1, imagePath, category], function () {
                            updateCart(userId);
                            alert("Item has been added to the cart.");
                        })
                    })
                }
            });
        });
    })

    $("#steakButton").click(function () {

        let user = cookieVal("username");
        let name = "Banquet Steak"
        let userId = 0;
        let price = 10.00;
        let itemAmount = 0;
        let imagePath = "assets/img/banquetSteak.jpg";
        let category = "Meat";
        //If user isn't signed in alert them to sign in
        if (user == null || user == "" || user == 0) {
            alert("Must sign in to add to cart");
            return 0;
        }
        //Transaction for user id from user
        db.transaction(t => {
            t.executeSql("SELECT id FROM users WHERE username = ?", [user], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    userId = row.id;
                }
            });

        });
        //Transction for itemAmount value of item if it already exist
        db.transaction(t => {
            t.executeSql("SELECT itemQuantity FROM items WHERE users_id = ? AND name = ?", [userId, name], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    itemAmount = row.itemQuantity + 1;

                    db.transaction(t2 => {
                        t2.executeSql("UPDATE items SET itemQuantity = ? WHERE users_id = ? AND name = ?", [itemAmount, userId, name]);
                        updateCart(userId);
                        alert("Item has been added to the cart.");
                        return 0;
                    });
                }
                else {
                    db.transaction(function (transaction) {
                        var sql = "INSERT INTO items(name,users_id,price,itemQuantity,imagePath,category) VALUES(?,?,?,?,?,?)";
                        transaction.executeSql(sql, [name, userId, price, 1, imagePath, category], function () {
                            updateCart(userId);
                            alert("Item has been added to the cart.");
                        })
                    })
                }
            });
        });
    })
    $("#potatoesButton").click(function () {

        let user = cookieVal("username");
        let name = "Golden Potatoes"
        let userId = 0;
        let price = 9.99;
        let itemAmount = 0;
        let imagePath = "assets/img/goldPotatoes.jpg";
        let category = "Vegetable";
        //If user isn't signed in alert them to sign in
        if (user == null || user == "" || user == 0) {
            alert("Must sign in to add to cart");
            return 0;
        }
        //Transaction for user id from user
        db.transaction(t => {
            t.executeSql("SELECT id FROM users WHERE username = ?", [user], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    userId = row.id;
                }
            });

        });
        //Transction for itemAmount value of item if it already exist
        db.transaction(t => {
            t.executeSql("SELECT itemQuantity FROM items WHERE users_id = ? AND name = ?", [userId, name], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    itemAmount = row.itemQuantity + 1;

                    db.transaction(t2 => {
                        t2.executeSql("UPDATE items SET itemQuantity = ? WHERE users_id = ? AND name = ?", [itemAmount, userId, name]);
                        updateCart(userId);
                        alert("Item has been added to the cart.");
                        return 0;
                    });
                }
                else {
                    db.transaction(function (transaction) {
                        var sql = "INSERT INTO items(name,users_id,price,itemQuantity,imagePath,category) VALUES(?,?,?,?,?,?)";
                        transaction.executeSql(sql, [name, userId, price, 1, imagePath, category], function () {
                            updateCart(userId);
                            alert("Item has been added to the cart.");
                        })
                    })
                }
            });
        });
    })
    $("#blueberryButton").click(function () {

        let user = cookieVal("username");
        let name = "Dole Blueberries"
        let userId = 0;
        let price = 7.00;
        let itemAmount = 0;
        let imagePath = "assets/img/blueberry.jpg";
        let category = "Fruit";
        //If user isn't signed in alert them to sign in
        if (user == null || user == "" || user == 0) {
            alert("Must sign in to add to cart");
            return 0;
        }
        //Transaction for user id from user
        db.transaction(t => {
            t.executeSql("SELECT id FROM users WHERE username = ?", [user], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    userId = row.id;
                }
            });

        });
        //Transction for itemAmount value of item if it already exist
        db.transaction(t => {
            t.executeSql("SELECT itemQuantity FROM items WHERE users_id = ? AND name = ?", [userId, name], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    itemAmount = row.itemQuantity + 1;

                    db.transaction(t2 => {
                        t2.executeSql("UPDATE items SET itemQuantity = ? WHERE users_id = ? AND name = ?", [itemAmount, userId, name]);
                        updateCart(userId);
                        alert("Item has been added to the cart.");
                        return 0;
                    });
                }
                else {
                    db.transaction(function (transaction) {
                        var sql = "INSERT INTO items(name,users_id,price,itemQuantity,imagePath,category) VALUES(?,?,?,?,?,?)";
                        transaction.executeSql(sql, [name, userId, price, 1, imagePath, category], function () {
                            updateCart(userId);
                            alert("Item has been added to the cart.");
                        })
                    })
                }
            });
        });
    })
    $("#plaidButton").click(function () {

        let user = cookieVal("username");
        let name = "Plaid Shirt"
        let userId = 0;
        let price = 10.00;
        let itemAmount = 0;
        let imagePath = "assets/img/plaid.jpg";
        let category = "Clothing";
        //If user isn't signed in alert them to sign in
        if (user == null || user == "" || user == 0) {
            alert("Must sign in to add to cart");
            return 0;
        }
        //Transaction for user id from user
        db.transaction(t => {
            t.executeSql("SELECT id FROM users WHERE username = ?", [user], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    userId = row.id;
                }
            });

        });
        //Transction for itemAmount value of item if it already exist
        db.transaction(t => {
            t.executeSql("SELECT itemQuantity FROM items WHERE users_id = ? AND name = ?", [userId, name], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    itemAmount = row.itemQuantity + 1;

                    db.transaction(t2 => {
                        t2.executeSql("UPDATE items SET itemQuantity = ? WHERE users_id = ? AND name = ?", [itemAmount, userId, name]);
                        updateCart(userId);
                        alert("Item has been added to the cart.");
                        return 0;
                    });
                }
                else {
                    db.transaction(function (transaction) {
                        var sql = "INSERT INTO items(name,users_id,price,itemQuantity,imagePath,category) VALUES(?,?,?,?,?,?)";
                        transaction.executeSql(sql, [name, userId, price, 1, imagePath, category], function () {
                            updateCart(userId);
                            alert("Item has been added to the cart.");
                        })
                    })
                }
            });
        });
    })
    $("#trousersButton").click(function () {

        let user = cookieVal("username");
        let name = "Black Trousers"
        let userId = 0;
        let price = 45.99;
        let itemAmount = 0;
        let imagePath = "assets/img/trousers.jpg";
        let category = "Clothing";
        //If user isn't signed in alert them to sign in
        if (user == null || user == "" || user == 0) {
            alert("Must sign in to add to cart");
            return 0;
        }
        //Transaction for user id from user
        db.transaction(t => {
            t.executeSql("SELECT id FROM users WHERE username = ?", [user], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    userId = row.id;
                }
            });

        });
        //Transction for itemAmount value of item if it already exist
        db.transaction(t => {
            t.executeSql("SELECT itemQuantity FROM items WHERE users_id = ? AND name = ?", [userId, name], function (transaction, result) {
                if (result.rows.length) {
                    let row = result.rows.item(0);
                    itemAmount = row.itemQuantity + 1;

                    db.transaction(t2 => {
                        t2.executeSql("UPDATE items SET itemQuantity = ? WHERE users_id = ? AND name = ?", [itemAmount, userId, name]);
                        updateCart(userId);
                        alert("Item has been added to the cart.");
                        return 0;
                    });
                }
                else {
                    db.transaction(function (transaction) {
                        var sql = "INSERT INTO items(name,users_id,price,itemQuantity,imagePath,category) VALUES(?,?,?,?,?,?)";
                        transaction.executeSql(sql, [name, userId, price, 1, imagePath, category], function () {
                            updateCart(userId);
                            alert("Item has been added to the cart.");
                        })
                    })
                }
            });
        });
    })
});