const knex = require('knex')

exports.up = function(knex) { // Pra criar uma nova migration: npx knex migrate:make <nome da migrate>
    return knex.schema.createTable('truckers', function(table) { // O método up é o responsável pela criação da tabela
        table.increments('id').primary().notNullable()
        table.string('name')
        table.integer('telephone') 
        table.string('cpf')
        table.integer('coins')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('truckers')
};