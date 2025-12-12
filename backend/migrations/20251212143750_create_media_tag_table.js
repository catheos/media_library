/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('media_tag', table => {
    table.increments('id').primary();
    table.integer('media_id').unsigned().notNullable();
    table.integer('tag_id').unsigned().notNullable();
    
    table.unique(['media_id', 'tag_id']);
    
    table.foreign('media_id')
      .references('id')
      .inTable('media')
      .onDelete('CASCADE');
      
    table.foreign('tag_id')
      .references('id')
      .inTable('tag')
      .onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('media_tag');
};