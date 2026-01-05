/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Media types
  const mediaTypes = [
    {name: 'novel'},
    {name: 'tv_series'},
    {name: 'anime'},
    {name: 'movie'},
    {name: 'comic'},
    {name: 'manga'},
    {name: 'video_game'}
  ];
  
  await knex('media_types')
    .insert(mediaTypes)
    .onConflict('name')
    .ignore();

  // Media status types
  const mediaStatusTypes = [
    {name: 'ongoing'},
    {name: 'completed'},
    {name: 'hiatus'},
    {name: 'upcoming'}
  ];
  
  await knex('media_status_types')
    .insert(mediaStatusTypes)
    .onConflict('name')
    .ignore();

  // User media status types
  const userMediaStatusTypes = [
    {name: 'planning'},
    {name: 'current'},
    {name: 'completed'},
    {name: 'dropped'},
    {name: 'on_hold'}
  ];
  
  await knex('user_media_status_types')
    .insert(userMediaStatusTypes)
    .onConflict('name')
    .ignore();
};