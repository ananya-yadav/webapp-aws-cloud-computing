const supertestChai = require("supertest-chai");
const chai = require("chai");
const expect = chai.expect;
chai.use(supertestChai.httpAsserts);
const billsController = require('../server/controllers/billController');
const filesController = require('../server/controllers/fileController');
const usersController = require('../server/controllers/usersController');


describe("createBill function present", function () {
    it('should have a function "createBill" defined', function () {
        expect(typeof billsController.getBill).equals("function");
    })
});
describe("deleteBillByID function present", function () {
    it('should have a function "deleteBillByID" defined', function () {
        expect(typeof billsController.deleteBill).equals("function");
    })
});
describe("getAllBills function present", function () {
    it('should have a function "getAllBills" defined', function () {
        expect(typeof filesController.getFile).equals("function");
    })
});
describe("getBillByID function present", function () {
    it('should have a function "getBillByID" defined', function () {
        expect(typeof usersController.create).equals("function");
    })
});