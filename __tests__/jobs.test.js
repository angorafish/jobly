"use strict";

const request = require("supertest");
const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  adminToken,
  u1Token,
} = require("../models/_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

let job1, job2, job3;

beforeAll(async () => {
  const jobs = await db.query(`SELECT id FROM jobs ORDER BY id`);
  job1 = jobs.rows[0].id;
  job2 = jobs.rows[1].id;
  job3 = jobs.rows[2].id;
});

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 100000,
    equity: "0.1",
    companyHandle: "c1",
  };

  test("ok for admins", async function () {
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

  test("unauth for non-admin users", async function () {
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
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          salary: "not-a-number",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: job1,
          title: "Job1",
          salary: 100000,
          equity: "0.1",
          companyHandle: "c1",
        },
        {
          id: job2,
          title: "Job2",
          salary: 200000,
          equity: "0.2",
          companyHandle: "c1",
        },
        {
          id: job3,
          title: "Job3",
          salary: 300000,
          equity: "0",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("works: filtering by title", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({ title: "Job1" });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: job1,
          title: "Job1",
          salary: 100000,
          equity: "0.1",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("works: filtering by minSalary", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({ minSalary: 150000 });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: job2,
          title: "Job2",
          salary: 200000,
          equity: "0.2",
          companyHandle: "c1",
        },
        {
          id: job3,
          title: "Job3",
          salary: 300000,
          equity: "0",
          companyHandle: "c2",
        },
      ],
    });
  });

  test("works: filtering by hasEquity", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({ hasEquity: true });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: job1,
          title: "Job1",
          salary: 100000,
          equity: "0.1",
          companyHandle: "c1",
        },
        {
          id: job2,
          title: "Job2",
          salary: 200000,
          equity: "0.2",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("works: filtering by title and minSalary and hasEquity", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({ title: "Job", minSalary: 150000, hasEquity: true });
    expect(resp.body).toEqual({
      jobs: [
        {
          id: job2,
          title: "Job2",
          salary: 200000,
          equity: "0.2",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("fails: test next() handler", async function () {
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs");
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${job1}`);
    expect(resp.body).toEqual({
      job: {
        id: job1,
        title: "Job1",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("not found if no such job", async function () {
    const resp = await request(app).get(`/jobs/999`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .patch(`/jobs/${job1}`)
        .send({
          title: "Job1-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: job1,
        title: "Job1-new",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .patch(`/jobs/${job1}`)
        .send({
          title: "Job1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${job1}`)
        .send({
          title: "Job1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/999`)
        .send({
          title: "No-such-job",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${job1}`)
        .send({
          id: 999,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${job1}`)
        .send({
          salary: "not-a-number",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/${job1}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: String(job1) });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/${job1}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${job1}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/999`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
