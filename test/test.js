var assert = require("assert");
var supertestChai = require("supertest-chai");
var chai = require("chai");
var app = require("../assignmentServer.js");
var request = supertestChai.request;
var expect = chai.expect;
var should = chai.should();
chai.use(supertestChai.httpAsserts);
let newBillId = "";



describe("User Test Route", function () {
    describe("POST /v1/user", function () {
        
        it("should successfully create a new user object", function (done) {
        var payload = {
            email_address: "unitTesting@husky.neu.edu",
            first_name: "Ananya",
            last_name: "Yadav",
            password: "AnaEfron@1713!"
        };
        var server = app.listen();
        request(server)
            .post("/v1/user")
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(201);
                res.body.should.be.a("object");
                done();
            });
    });
        
        it("should successfully create a new bill object", function (done) {
        var payload = {
            "vendor": "Test Bill",
            "bill_date": "2020-01-29",
            "due_date": "2020-01-31",
            "amount_due": 10.22,
            "categories": [
              "college",
              "tuition",
              "spring2020"
            ],
            "paymentStatus": "no_payment_required"
          };
        var server = app.listen();
        request(server)
            .post("/v1/bill")
            .auth('unitTesting@husky.neu.edu', 'AnaEfron@1713!')
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                newBillId = res.body.id;
                res.should.have.status(201);
                res.body.should.be.a("object");
                done();
            });
    });


        it("should return an error if first name  is not present while creating a user", function (done) {
            var payload = {
                email_address: "tfsdddsest4@gmail.com",
                last_name: "Efron3",
                password: "AnaEfron@1713!"
            };
            var server = app.listen();
            request(server)
                .post("/v1/user")
                .send(payload)
                .end(function (err, res) {
                    if (err) done(err);
                    res.should.have.status(400);
                    res.body.should.be.a("object");
                    done();
                });
        });

    });
    describe("getUser/v1/user/self", function () {

        it("should return an invalid user successfully", function (done) {

            var server = app.listen();
            request(server)
                .get("/v1/user/self")
                .auth('3', 'AnaEfron@1713!')

                .end(function (err, res) {
                    if (err) done(err);
                    res.should.have.status(404);
                    res.body.should.be.a("object");
                    done();

                });
        });

    });

});
describe("put/v1/user/self", function () {

    it("should not update the user successfully", function (done) {
        var payload = {
            email_address: "tfsdddsest4@gmail.com",
            first_name: "3",
            last_name: "Efron3",
            password: "AnaEfron@1713!"
        };
        var server = app.listen();
        request(server)
            .put("/v1/user/self")
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(401);
                res.body.should.be.a("object");
                done();

            });
    });

});

    describe("Bill Test Route", function () {
        describe("POST /v1/bill", function () {


            it("should return an error if vendor is not present while creating a user", function (done) {
                var payload = {
                     bill_date : "2020-01-06",
                    due_date : "2020-01-12",
                    amount_due: 3245.51,
                    categories: [
                        "college",
                        "tuition",
                        "spring2020"
                    ],
                    paymentStatus: "paid"
                };
                var server = app.listen();
                request(server)
                    .post("/v1/bill")
                    .send(payload)
                    .end(function (err, res) {
                        if (err) done(err);
                        res.should.have.status(400);
                        res.body.should.be.a("object");
                        done();
                    });
            });

        });
        describe("getbills/v1/bills", function () {

            it("should return all valid bills successfully", function (done) {

                var server = app.listen();
                request(server)
                    .get("/v1/bills")
                    .auth('unitTesting@husky.neu.edu', 'AnaEfron@1713!')
                    .end(function (err, res) {
                        if (err) done(err);
                        res.should.have.status(200);
                        res.body.should.be.a("array");
                        done();

                    });
            });

        });

    });
describe("put/v1/bill/:id", function () {

    it("should update a bill of the given id when user is authorized ", function (done) {
        var server = app.listen();
        var payload = {
            "vendor": "Updated Bill",
            "bill_date": "2020-01-28",
            "due_date": "2020-01-31",
            "amount_due": 500.22,
            "categories": [
              "college",
              "tuition",
              "spring2020"
            ],
            "paymentStatus": "paid"
          };
        request(server)
            .put(`/v1/bill/${newBillId}`)
            .auth('unitTesting@husky.neu.edu', 'AnaEfron@1713!')
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(204);
                res.body.should.be.a("object");
                done();
            });
    });

});


