/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('character', table => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.text('details').nullable();  // All character info here
    table.string('wiki_url', 512).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
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
  return knex.schema.dropTableIfExists('character');
};