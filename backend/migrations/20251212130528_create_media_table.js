/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('media', table => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.integer('type_id').unsigned().notNullable();
    table.integer('release_year').unsigned().nullable();
    table.integer('status_id').unsigned().notNullable();
    table.text('description').nullable();
    table.integer("created_by").unsigned().notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('created_by')
      .references('id')
      .inTable('user')
      .onDelete('RESTRICT');
    
    table.foreign('type_id')
      .references('id')
      .inTable('media_types')
      .onDelete('RESTRICT');
      
    table.foreign('status_id')
      .references('id')
      .inTable('media_status_types')
      .onDelete('RESTRICT');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('media');
};