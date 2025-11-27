// Usa la API de community viz
// dscc viene de dscc.min.js (incluida en manifest.json)

const width = 400;
const height = 400;
const margin = 40;

function drawViz(data) {
  // data.tables.DEFAULT: filas y columnas
  const table = data.tables.DEFAULT;

  // Tomamos solo la primera fila (se espera 1 empresa filtrada)
  if (!table || !table.rows || table.rows.length === 0) {
    return;
  }
  const row = table.rows[0];

  // Nombres de las métricas (columnas) -> categorías del radar
  const metricFields = data.fields.metric;
  const metrics = metricFields.map((f, idx) => {
    return {
      name: f.name,
      value: row.metricValues[idx].value || 0
    };
  });

  // Calcula máximo para escalar
  const maxValue = d3.max(metrics, d => +d.value) || 1;

  // Limpia el contenedor
  const container = document.body;
  container.innerHTML = '';

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const radius = Math.min(width, height) / 2 - margin;
  const centerX = width / 2;
  const centerY = height / 2;

  const angleSlice = (2 * Math.PI) / metrics.length;

  // Escala radial
  const rScale = d3.scaleLinear()
    .domain([0, maxValue])
    .range([0, radius]);

  // Ejes radiales (líneas desde el centro)
  const axisGrid = svg.append('g')
    .attr('class', 'axisWrapper')
    .attr('transform', `translate(${centerX},${centerY})`);

  metrics.forEach((m, i) => {
    const angle = i * angleSlice - Math.PI / 2; // empezamos arriba
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    // línea del eje
    axisGrid.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', x)
      .attr('y2', y)
      .attr('stroke', '#ccc');

    // etiqueta
    axisGrid.append('text')
      .attr('x', x * 1.1)
      .attr('y', y * 1.1)
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('text-anchor', 'middle')
      .text(m.name);
  });

  // Puntos del polígono
  const points = metrics.map((m, i) => {
    const angle = i * angleSlice - Math.PI / 2;
    const r = rScale(+m.value);
    return {
      x: r * Math.cos(angle),
      y: r * Math.sin(angle)
    };
  });

  // Polígono
  const radarLine = d3.line()
    .x(d => d.x)
    .y(d => d.y)
    .curve(d3.curveLinearClosed);

  axisGrid.append('path')
    .datum(points)
    .attr('d', radarLine)
    .attr('fill', 'rgba(0, 123, 255, 0.3)')
    .attr('stroke', '#0056b3')
    .attr('stroke-width', 2);

  // Puntos
  axisGrid.selectAll('.radarCircle')
    .data(points)
    .enter()
    .append('circle')
    .attr('class', 'radarCircle')
    .attr('r', 3)
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .style('fill', '#0056b3');
}

// Suscribimos la función a los datos
dscc.subscribeToData(drawViz, {transform: dscc.tableTransform});
