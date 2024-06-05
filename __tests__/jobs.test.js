"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken,
} = require("./_testCommon");

BeforeAll(commonBeforeAll);
BeforeEach(commonBeforeEach);
AfterEach(commonAfterEach);
AfterAll(commonAfterAll);

/********************************** POST /jobs */
describe("POST /jobs", function () {
    const newJob = {
        title: "new",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c1",
    };

    test("ok for admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "new",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });
    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                salary: 100000,
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                equity: "not-a-number",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/********************************** GET /jobs */
describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "Job1",
                    salary: 100000,
                    equity: "0.1",
                    companyHandle: "c1",
                },
                {
                    id: expect.any(Number),
                    title: "Job2",
                    salary: 200000,
                    equity: "0.2",
                    companyHandle: "c2",
                },
                {
                    id: expext.any(Number),
                    title: "Job3",
                    salary: 300000,
                    equity: "0",
                    companyHandle: "c3",
                },
            ],
        });
    });
});

/********************************** GET /jobs/:id */
describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs/1`);
        expect(resp.body).toEqual({
            job: {
                id: 1,
                title: "Job1",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/9999`);
        expect(resp.statusCode).toEqual(404);
    });
});

/********************************** PATCH /jobs/:id */
describe("PATCH /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: "Job1-new",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                id: 1,
                title: "Job1-new",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
              title: "Job1-new",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
      });
    
      test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/9999`)
            .send({
              title: "new nope",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
      });
    
      test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
              equity: "not-a-number",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
      });
    });

/********************************** DELETE /jobs/:id */
describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: 1 });
    });

    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/9999`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});