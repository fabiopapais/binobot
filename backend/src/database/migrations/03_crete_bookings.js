exports.up = function(knex) { // Pra criar uma nova migration: npx knex migrate:make <nome da migrate>
    return knex.schema.createTable('bookings', function(table) { // O método up é o responsável pela criação da tabela
        table.increments('id').primary().notNullable()
        table.integer('trucker_id').notNullable()
        table.integer('point_id').notNullable()
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('bookings')
};