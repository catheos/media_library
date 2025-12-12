/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('tag', table => {
    table.increments('id').primary();
    table.string('name', 128).notNullable();
    table.integer('type_id').unsigned().notNullable();
    
    table.foreign('type_id')
      .references('id')
      .inTable('tag_types')
      .onDelete('RESTRICT');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('tag');
};