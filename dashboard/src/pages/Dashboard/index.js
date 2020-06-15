import React, { useState, useEffect } from 'react';

import api from '../../services/api'

import './styles.css'

export default function Dashboard() {
  const [point, setPoint] = useState({});

  const [avaliations, setAvaliations] = useState([]);

  useEffect(() => {

    async function getData() {
      const pointReq = await api.get('/points/1');
      const avaliationsReq = await api.get('/avaliations/1');

      setAvaliations(avaliationsReq.data);
      setPoint(pointReq.data);
    }
    getData()


  }, [])

  return (
    <div id="content-dashboard">
      <h1>{point.name}</h1>
      <div id="dashboard-data">
        <div id="general-data">
          <h4>Avaliação média: {point.starts}⭐</h4>
          <h4>Avaliação média sobre o preço: {point.price}💸 </h4>
        </div>
        <div id="evaluations">
          { avaliations.map((avaliation) => (
            <div className="evaluation" >
              <p className="comment">"{avaliation.avaliation}"</p>
              <h5 className="numbers">Nota: {avaliation.stars}⭐</h5>
              <h5 className="numbers">Preço: {avaliation.price}💸</h5>
            </div>
          )) }
        </div>
      </div>
    </div>
  )
}
