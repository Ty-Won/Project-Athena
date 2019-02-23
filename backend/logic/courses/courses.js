const mysql = require("../../sql/connection");
const format = require("../../validation/format");

/**
 * Returns a list of courses matching the tag
 * @author Alex Lam
 * @param {string} tag
 * @returns A list of courses in JSON format
 * @throws Undefined tag if tag is null
 *         error if MySQL connection failed
 */
var queryCourseByTag = async function queryCourseByTag(tag) {
  if (!tag) {
    throw Error("Undefined tag");
  }

  let connection = await mysql.getNewConnection();
  try {
    let courses = await connection.query(
      "SELECT course_code FROM course_tags WHERE tag_name LIKE ?",
      tag
    );
    connection.release();
    return JSON.parse(JSON.stringify(courses));
  } catch (error) {
    connection.release();
    console.error(error);
    throw Error(error.message);
  }
};

/**
 * Adds a student's completed courses into the database
 * @author Steven Li
 * @param {int} studentId
 * @param {JSON} courses
 * @returns true if successful
 * @throws error if MySQL connection failed
 *         invalid format courses if JSON format is incorrect
 *         false if insertion failed
 */
var addCompletedCourses = async (studentId, courses) => {
  await format.verifyCourse(courses);
  let connection = await mysql.getNewConnection();

  try {
    // Obtain all current course offerings and put them into a hashtable for fast lookup
    let results = await connection.query(
      "SELECT course_code, semester, section, id FROM course_offerings;"
    );
    let hashTable = {};
    for (let i = 0; i < results.length; i++) {
      hashTable[
        results[i].course_code + results[i].semester + results[i].section
      ] = results[i].id;
    }

    await connection.beginTransaction();
    // Insert each course of the student into the database. If a course does not exist then
    // throw an error.
    for (let course in courses) {
      for (let i = 0; i < courses[course].length; i++) {
        let id =
          hashTable[
            course + courses[course][i].semester + courses[course][i].section
          ];
        await connection.query(
          "INSERT INTO student_course_offerings VALUES(?, ?, ?);",
          [studentId, id, courses[course][i].semester]
        );
      }
    }

    await connection.commit();
    connection.release();
    return true;
  } catch (error) {
    console.error(error);
    await connection.rollback();
    connection.release();
    throw new Error(false);
  }
};

/**
 * Returns all available courses from the database
 * @author Steven Li
 * @returns a list of available courses from the database in JSON format
 * @throws error if MySQL connection failed
 */
var getAllCourses = async () => {
  let connection = await mysql.getNewConnection();
  let courses;
  let result;
  try {
    result = await connection.query("SELECT * FROM courses;");
  } catch (err) {
    console.error(err);
  }
  connection.release();

  if (result) {
    courses = result;
  }
  return courses;
};

/**
 * Adds a list of course offerings into the database
 * @author Steven Li
 * @param {JSON} courseOfferings
 * @returns true if successful
 * @throws error if MySQL connection failed
 *         invalid format course offerings if JSON format is wrong
 *         false if insertion failed
 */
var addCourseOfferings = async courseOfferings => {
  await format.verifyCourseOffering(courseOfferings);
  let connection = await mysql.getNewConnection();
  let query =
    "INSERT INTO course_offerings (id, semester, scheduled_time, course_code, section) VALUES (?, ?, ?, ?, ?);";
  try {
    await connection.beginTransaction();
    // Insert each course offering into the database
    for (let courseCode in courseOfferings) {
      for (let i = 0; i < courseOfferings[courseCode].length; i++) {
        await connection.query(query, [
          courseOfferings[courseCode][i].id,
          courseOfferings[courseCode][i].semester,
          courseOfferings[courseCode][i].scheduled_time,
          courseCode,
          courseOfferings[courseCode][i].section
        ]);
      }
    }

    await connection.commit();
    connection.release();
    return true;
  } catch (error) {
    console.error(error);
    await connection.rollback();
    connection.release();
    throw new Error(false);
  }
};

/**
 * Adds a list of coreq into the database
 * @author Steven Li
 * @param {JSON} coreq
 *        {
 *          "ECSE 428": ["ECSE 321"],
 *          "MATH 270": ["MATH 140", "MATH 240"]
 *        }
 * @returns true if insertion was successful
 * @throws error if MySQL connection failed
 *         invalid format coreq if JSON format is wrong
 *         false if insertion failed
 */
var addCoreq = async coreq => {
  await format.verifyCoreq(coreq);
  let connection = await mysql.getNewConnection();
  let query =
    "INSERT INTO course_coreq (course_code, coreq_course_code) VALUES (?, ?);";
  try {
    await connection.beginTransaction();
    for (let course in coreq) {
      for (let i = 0; i < coreq[course].length; i++) {
        await connection.query(query, [course, coreq[course][i]]);
      }
    }
    await connection.commit();
    connection.release();
    return true;
  } catch (error) {
    console.error(error);
    await connection.rollback();
    connection.release();
    throw new Error(false);
  }
};

/**
 * Adds a list of prereq into the database
 * @author Steven Li
 * @param {JSON} prereq
 *        {
 *          "ECSE 428": ["ECSE 321"],
 *          "MATH 270": ["MATH 140", "MATH 240"]
 *        }
 * @returns true if insertion was successful
 * @throws error if MySQL connection failed
 *         invalid format prereq if JSON format is wrong
 *         false if insertion failed
 */
var addPrereq = async prereq => {
  await format.verifyPrereq(prereq);
  let connection = await mysql.getNewConnection();
  let query =
    "INSERT INTO course_prereq (course_code, prereq_course_code) VALUES (?, ?);";
  try {
    await connection.beginTransaction();
    for (let course in prereq) {
      for (let i = 0; i < prereq[course].length; i++) {
        await connection.query(query, [course, prereq[course][i]]);
      }
    }
    await connection.commit();
    connection.release();
    return true;
  } catch (error) {
    console.error(error);
    await connection.rollback();
    connection.release();
    throw new Error(false);
  }
};

/**
 * Updates a course title and its tags
 * @author Steven Li
 * @param {string} course
 * @param {string} newTitle
 * @param {array} newTags
 * @returns true if insertion was successful
 * @throws error if MySQL connection failed
 *         invalid format course code if the course code is invalid
 *         false if insertion failed
 */
var updateCourse = async (course, newTitle, newTags) => {
  await format.verifyCourseCode(course);
  let connection = await mysql.getNewConnection();

  try {
    await connection.beginTransaction();
    await connection.query(
      "DELETE FROM course_tag WHERE course_code = ?;",
      course
    );

    for (let i = 0; i < newTags.length; i++) {
      await connection.query(
        "INSERT INTO course_tag (course_code, tag_name) VALUES (?, ?);",
        [course, newTags[i]]
      );
    }

    await connection.query(
      "UPDATE courses SET title = ? WHERE course_code = ?;",
      [newTitle, course]
    );
    await connection.commit();
    connection.release();
    return true;
  } catch (error) {
    console.error(error);
    await connection.rollback();
    connection.release();
    throw new Error(false);
  }
};

module.exports = {
  queryCourseByTag,
  addCompletedCourses,
  addCourseOfferings,
  getAllCourses,
  addCoreq,
  addPrereq,
  updateCourse
};
