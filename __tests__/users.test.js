"use strict";

const request = require("supertest");
const db = require("../db");
const app = require("../app");
const User = require("../models/user");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  adminToken,
} = require("../models/_testCommon");

let jobId1, jobId2, jobId3;

beforeAll(async () => {
  await commonBeforeAll();
  const jobs = await db.query(`SELECT id FROM jobs ORDER BY id`);
  jobId1 = jobs.rows[0].id.toString();
  jobId2 = jobs.rows[1].id.toString();
  jobId3 = jobs.rows[2].id.toString();
  console.log("Fetched jobId1: ", jobId1);
});
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users/:username/jobs/:id */

describe("POST /users/:username/jobs/:id", function () {
  test("works for same user", async function () {
    // Clean up existing application to avoid duplicate key error
    await db.query(`DELETE FROM applications WHERE username='u1' AND job_id=$1`, [jobId1]);

    const resp = await request(app)
        .post(`/users/u1/jobs/${jobId1}`)
        .set("authorization", `Bearer ${u1Token}`);
    console.log("Response body: ", resp.body);  // Log the response body for debugging
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ applied: jobId1 });
  });

  test("works for admin", async function () {
    // Clean up existing application to avoid duplicate key error
    await db.query(`DELETE FROM applications WHERE username='u1' AND job_id=$1`, [jobId1]);

    const resp = await request(app)
        .post(`/users/u1/jobs/${jobId1}`)
        .set("authorization", `Bearer ${adminToken}`);
    console.log("Response body: ", resp.body);  // Log the response body for debugging
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ applied: jobId1 });
  });

  test("unauth for other users", async function () {
    const resp = await request(app)
        .post(`/users/u1/jobs/${jobId1}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such user", async function () {
    const resp = await request(app)
        .post(`/users/nope/jobs/${jobId1}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .post(`/users/u1/jobs/9999`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "admin",
          firstName: "admin",
          lastName: "admin",
          email: "admin@user.com",
          isAdmin: true,
        },
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
          isAdmin: false,
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
          isAdmin: false,
        },
      ],
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async function () {
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
        jobs: [parseInt(jobId1), parseInt(jobId2), parseInt(jobId3)], // Adjusted to match expected jobs for user u1
      },
    });
  });

  test("works for same user", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
        jobs: [parseInt(jobId1), parseInt(jobId2), parseInt(jobId3)], // Adjusted to match expected jobs for user u1
      },
    });
  });

  test("unauth for non-admin, different user", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found", async function () {
    const resp = await request(app)
        .get(`/users/nope`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});