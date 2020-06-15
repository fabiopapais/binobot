const knex = require('knex')
 
exports.up = function(knex) { // Pra criar uma nova migration: npx knex migrate:make <nome da migrate>
    return knex.schema.createTable('points_truckers', function(table) { // O método up é o responsável pela criação da tabela
        table.integer('point_id').notNullable()
        table.integer('trucker_id').notNullable()
        table.integer('avaliation').notNullable()
        table.integer('stars').notNullable()
        table.integer('price')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('points_truckers')
};