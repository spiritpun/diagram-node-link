const tree = () => {
  const svgW = 960;
  const svgH = 460;
  const vRad = 12;
  const tree = { cx: 500, cy: 30, w: 70, h: 70 };

  tree.vis = { v: 0, l: 1, p: { x: tree.cx, y: tree.cy }, c: [] };
  tree.size = 1;
  tree.glabels = [];
  (tree.incX = 500), (tree.incY = 30), (tree.incS = 20);
  i = tree.size;

  // Set vertical access of Circles
  tree.getVertices = () => {
    const v = [];
    getVertices = (t, f) => {
      v.push({ v: t.v, l: t.l, p: t.p, f: f });
      t.c.forEach(d => getVertices(d, { v: t.v, p: t.p }));
    };
    getVertices(tree.vis, {});
    return v.sort((a, b) => a.v - b.v);
  };

  // Set Edge points of Circles
  tree.getEdges = () => {
    const e = [];
    getEdges = _ => {
      _.c.forEach(d =>
        e.push({ v1: _.v, l1: _.l, p1: _.p, v2: d.v, l2: d.l, p2: d.p })
      );
      _.c.forEach(getEdges);
    };
    getEdges(tree.vis);
    return e.sort((a, b) => a.v2 - b.v2);
  };

  // Add to tree
  tree.addLeaf = _ => {
    addLeaf = t => {
      if (t.v == _) {
        t.c.push({ v: tree.size++, l: tree.size, p: {}, c: [] });
        return;
      }
      t.c.forEach(addLeaf);
    };
    addLeaf(tree.vis);
    reposition(tree.vis);
    if (tree.glabels.length != 0) {
      tree.glabels = [];
      relabel({
        lbl: d3.range(0, tree.size).map(function(d) {
          return '?';
        }),
      });
      d3.select('#labelnav').style('visibility', 'hidden');
    }
    redraw();
  };

  // Rerender elements when new element is added
  redraw = () => {
    const edges = d3
      .select('#g_lines')
      .selectAll('line')
      .data(tree.getEdges());

    edges
      .transition()
      .duration(500)
      .attr('x1', d => d.p1.x)
      .attr('y1', d => d.p1.y)
      .attr('x2', d => d.p2.x)
      .attr('y2', d => d.p2.y);

    edges
      .enter()
      .append('line')
      .attr('x1', d => d.p1.x)
      .attr('y1', d => d.p1.y)
      .attr('x2', d => d.p1.x)
      .attr('y2', d => d.p1.y)
      .transition()
      .duration(500)
      .attr('x2', d => d.p2.x)
      .attr('y2', d => d.p2.y);

    var circles = d3
      .select('#g_circles')
      .selectAll('circle')
      .data(tree.getVertices());

    circles
      .transition()
      .duration(500)
      .attr('cx', d => d.p.x)
      .attr('cy', d => d.p.y);

    circles
      .enter()
      .append('circle')
      .attr('cx', d => d.f.p.x)
      .attr('cy', d => d.f.p.y)
      .attr('r', vRad)
      .on('click', function(d) {
        return tree.addLeaf(d.v);
      })
      .transition()
      .duration(500)
      .attr('cx', function(d) {
        return d.p.x;
      })
      .attr('cy', function(d) {
        return d.p.y;
      });

    var labels = d3
      .select('#g_labels')
      .selectAll('text')
      .data(tree.getVertices());

    labels
      .text(function(d) {
        return d.l;
      })
      .transition()
      .duration(500)
      .attr('x', function(d) {
        return d.p.x;
      })
      .attr('y', function(d) {
        return d.p.y + 5;
      });

    labels
      .enter()
      .append('text')
      .attr('x', function(d) {
        return d.f.p.x;
      })
      .attr('y', function(d) {
        return d.f.p.y + 5;
      })
      .text(function(d) {
        return d.l;
      })
      .on('click', function(d) {
        return tree.addLeaf(d.v);
      })
      .transition()
      .duration(500)
      .attr('x', function(d) {
        return d.p.x;
      })
      .attr('y', function(d) {
        return d.p.y + 5;
      });

    var elabels = d3
      .select('#g_elabels')
      .selectAll('text')
      .data(tree.getEdges());

    elabels
      .attr('x', function(d) {
        return (d.p1.x + d.p2.x) / 2 + (d.p1.x < d.p2.x ? 8 : -8);
      })
      .attr('y', function(d) {
        return (d.p1.y + d.p2.y) / 2;
      })
      .text(function(d) {
        return tree.glabels.length == 0 ? '' : Math.abs(d.l1 - d.l2);
      });

    elabels
      .enter()
      .append('text')
      .attr('x', function(d) {
        return (d.p1.x + d.p2.x) / 2 + (d.p1.x < d.p2.x ? 8 : -8);
      })
      .attr('y', function(d) {
        return (d.p1.y + d.p2.y) / 2;
      })
      .text(function(d) {
        return tree.glabels.length == 0 ? '' : Math.abs(d.l1 - d.l2);
      });
  };

  getLeafCount = _ => {
    if (_.c.length == 0) {
      return 1;
    } else {
      return _.c.map(getLeafCount).reduce((a, b) => a + b);
    }
  };

  // Reposition divs when new divs are added
  reposition = v => {
    let lC = getLeafCount(v),
      left = v.p.x - (tree.w * (lC - 1)) / 2;
    v.c.forEach(d => {
      let w = tree.w * getLeafCount(d);
      left += w;
      d.p = { x: left - (w + tree.w) / 2, y: v.p.y + tree.h };
      reposition(d);
    });
  };

  // Append divs to DOM
  initialize = () => {
    // Create canvas
    d3.select('body')
      .append('svg')
      .attr('width', svgW)
      .attr('height', svgH)
      .attr('id', 'treesvg');

    // Append Lines
    d3.select('#treesvg')
      .append('g')
      .attr('id', 'g_lines')
      .selectAll('line')
      .data(tree.getEdges())
      .enter()
      .append('line')
      .attr('x1', d => d.p1.x)
      .attr('y1', d => d.p1.y)
      .attr('x2', d => d.p2.x)
      .attr('y2', d => d.p2.y);

    // Append Circles
    d3.select('#treesvg')
      .append('g')
      .attr('id', 'g_circles')
      .selectAll('circle')
      .data(tree.getVertices())
      .enter()
      .append('circle')
      .attr('cx', d => d.p.x)
      .attr('cy', d => d.p.y)
      .attr('r', vRad)
      .on('click', d => tree.addLeaf(d.v));

    // Append Text to Circles
    d3.select('#treesvg')
      .append('g')
      .attr('id', 'g_labels')
      .selectAll('text')
      .data(tree.getVertices())
      .enter()
      .append('text')
      .attr('x', d => d.p.x)
      .attr('y', d => d.p.y + 5)
      .text(d => d.l)
      .on('click', d => tree.addLeaf(d.v));

    // Add animation to new div
    d3.select('body')
      .select('svg')
      .append('g')
      .attr(
        'transform',
        () => 'translate(' + tree.incX + ',' + tree.incY + ')'
      );

    tree.addLeaf(0);
    tree.addLeaf(0);
  };
  initialize();
  return tree;
};
tree();
