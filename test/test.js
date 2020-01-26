var assert = require("assert");
var supertestChai = require("supertest-chai");
var chai = require("chai");
var app = require("../assignment2.js");
var request = supertestChai.request;
var expect = chai.expect;
var should = chai.should();
chai.use(supertestChai.httpAsserts);

describe("User Test Route", function () {
    describe("POST /v1/user", function () {
       

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
    describe("getUser/v1/user/self",function(){

        it("should return an invalid user successfully", function (done) {
           
            var server = app.listen();
            request(server)
                .get("/v1/user/self")
                .auth('3','AnaEfron@1713!' )
               
                .end(function (err, res) {
                    if (err) done(err);
                    res.should.have.status(404);
                    res.body.should.be.a("object");
                    done();

                });
            });
    
        });
            
});
describe("put/v1/user/self",function(){

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
        
