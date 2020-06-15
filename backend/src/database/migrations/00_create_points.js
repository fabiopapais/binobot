const knex = require('knex')

exports.up = function(knex) { // Pra criar uma nova migration: npx knex migrate:make <nome da migrate>
    return knex.schema.createTable('points', function(table) { // O método up é o responsável pela criação da tabela
        table.increments('id').primary().notNullable()
        table.string('name').notNullable()
        table.string('location').notNullable() 
        table.integer('prices_count')
        table.integer('stars_count')
        table.decimal('latitude')
        table.decimal('longitude')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('points')
};