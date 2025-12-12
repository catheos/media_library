/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('media_character', table => {
    table.increments('id').primary();
    table.integer('media_id').unsigned().notNullable();
    table.integer('character_id').unsigned().notNullable();
    table.integer('role_id').unsigned().notNullable();
    
    table.unique(['media_id', 'character_id']);
    
    table.foreign('media_id')
      .references('id')
      .inTable('media')
      .onDelete('CASCADE');
      
    table.foreign('character_id')
      .references('id')
      .inTable('character')
      .onDelete('CASCADE');
      
    table.foreign('role_id')
      .references('id')
      .inTable('character_roles')
      .onDelete('RESTRICT');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('media_character');
};