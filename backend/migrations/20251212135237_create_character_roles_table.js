/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('character_roles', table => {
    table.increments('id').primary();
    table.string('name', 64).notNullable().unique();
    table.integer("created_by").unsigned().notNullable();

    table.foreign('created_by')
      .references('id')
      .inTable('user')
      .onDelete('RESTRICT');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('character_roles');
};