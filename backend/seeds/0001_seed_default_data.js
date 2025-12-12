/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('media_types').del()
  await knex('media_types').insert([
    {name: 'novel'},
    {name: 'tv_series'},
    {name: 'anime'},
    {name: 'movie'},
    {name: 'comic'},
    {name: 'manga'},
    {name: 'video_game'}
  ]);

  await knex('media_status_types').del()
  await knex('media_status_types').insert([
    {name: 'ongoing'},
    {name: 'completed'},
    {name: 'hiatus'},
    {name: 'upcoming'}
  ])

  await knex('character_roles').del()
  await knex('character_roles').insert([
    {name: 'protagonist'},
    {name: 'antagonist'},
    {name: 'supporting'},
    {name: 'cameo'}
  ])

  await knex('user_media_status_types').del()
  await knex('user_media_status_types').insert([
    {name: 'planning'},
    {name: 'current'},
    {name: 'completed'},
    {name: 'dropped'},
    {name: 'on_hold'}
  ])

  await knex('user_media_status_types')
};
