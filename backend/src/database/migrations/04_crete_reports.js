exports.up = function(knex) { // Pra criar uma nova migration: npx knex migrate:make <nome da migrate>
    return knex.schema.createTable('reports', function(table) { // O método up é o responsável pela criação da tabela
        table.increments('id').primary().notNullable()
        table.integer('trucker_id').notNullable()
        table.string('report').notNullable()
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('reports', function(table) {
        table.integer('point_id')
    })
};