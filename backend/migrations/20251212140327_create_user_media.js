/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_media', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('media_id').unsigned().notNullable();
    
    // Progress tracking
    table.string('current_progress', 255).nullable();
    table.integer('status_id').unsigned().nullable();
    table.timestamp('progress_updated').nullable();
    
    // Rating/Review
    table.tinyint('score').unsigned().nullable();
    table.text('review').nullable();
    table.timestamp('rating_created').nullable();
    
    // Metadata
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.unique(['user_id', 'media_id']);
    
    table.foreign('user_id')
      .references('id')
      .inTable('user')
      .onDelete('CASCADE');
      
    table.foreign('media_id')
      .references('id')
      .inTable('media')
      .onDelete('CASCADE');
      
    table.foreign('status_id')
      .references('id')
      .inTable('user_media_status_types')
      .onDelete('RESTRICT');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user_media');
};