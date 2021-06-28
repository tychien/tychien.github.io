// Define env variables (INIT):
var _init = {
  env: {
    max_depth : 6000,
    c0 : 1480,
    grad : 0.016
  },
  veh1: {
    x:0,
    y:0,
    z:5500,
    spd:1,
    hdg:20*Math.PI/180,
  },
  veh2: {
    x:15000,
    y:15000,
    z:5500,
    spd:1,
    hdg:150*Math.PI/180,
  }
}

// Set ranges for init values
_init.veh1.r = 0
_init.veh2.r = Math.sqrt(Math.pow(_init.veh2.x-_init.veh1.x,2) +
                         Math.pow(_init.veh2.y-_init.veh1.y,2))

// Define data sources
var sources = {
  env: new Bokeh.ColumnDataSource({
    data: {r:[0,_init.veh2.r],
           surf:[0,0],
           bot:[_init.env.max_depth,_init.env.max_depth]}
  }),
  vehicles: new Bokeh.ColumnDataSource({
    data: {r1:[0],r2:[_init.veh2.r],
           x1:[_init.veh1.x],     x2:[_init.veh2.x],
           y1:[_init.veh1.y],     y2:[_init.veh2.y],
           z1:[_init.veh1.z],     z2:[_init.veh2.z],
           spd1:[_init.veh1.spd], spd2:[_init.veh2.spd],
           hdg1:[_init.veh1.hdg], hdg2:[_init.veh2.hdg]}
  }),
  ssp: new Bokeh.ColumnDataSource({
    data: {c:[_init.env.c0,_init.env.c0+_init.env.grad*_init.env.max_depth],
           z:[0,_init.env.max_depth]}
  }),
  aco_path: {
    c:    new Bokeh.ColumnDataSource({data: {rc:[],zc:[]}}),
    s:    new Bokeh.ColumnDataSource({data: {rs:[],zs:[]}}),
    geom: new Bokeh.ColumnDataSource({data: {rs:[[]],zs:[[]]}}),
  },
  alt_path: {
    s: new Bokeh.ColumnDataSource({data: {rs:[],zs:[]}}),
    c: new Bokeh.ColumnDataSource({data: {rc:[],zc:[]}})
  },
  loc: {
    transects: new Bokeh.ColumnDataSource({data: {x1:[],y1:[],z1:[],x2:[],y2:[]}}),
    ca_range1: new Bokeh.ColumnDataSource({data: {x:[],y:[]}}),
    ca_range2: new Bokeh.ColumnDataSource({data: {x:[],y:[],z:[]}}),
    solutions: new Bokeh.ColumnDataSource(
      {data: {x_time:[],y_time:[],z_time:[],x_range:[],y_range:[],z_range:[]}}),
  }
}


// Define callbacks
var callbacks = {
  depth : new Bokeh.CustomJS({code:"\
    setMaxDepth(parseFloat(this.value));\
    "}),
  c0 : new Bokeh.CustomJS({code:"\
    var new_c0 = parseFloat(this.value);\
    var c_grad = parseFloat(env.c_grad.value);\
    var max_depth = sources.env.data.bot[0];\
    sources.ssp.data.c = [new_c0,new_c0+c_grad*max_depth];\
    console.log(\"New c0: \");\
    console.log(new_c0);\
    sources.ssp.change.emit();\
    getCommAngle();\
    "}),
  c_grad : new Bokeh.CustomJS({code:"\
    var new_c_grad = parseFloat(this.value);\
    var c0 = parseFloat(env.c0.value);\
    var max_depth = sources.env.data.bot[0];\
    sources.ssp.data.c = [c0,c0+new_c_grad*max_depth];\
    console.log(\"New c_grad: \");\
    console.log(new_c_grad);\
    sources.ssp.change.emit();\
    getCommAngle();\
    "}),
  spd1 : new Bokeh.CustomJS({code:"\
    sources.vehicles.data.spd1[0] = parseFloat(this.value);\
    sources.ssp.change.emit();\
    getCommAngle();\
    "}),
  spd2 : new Bokeh.CustomJS({code:"\
    sources.vehicles.data.spd2[0] = parseFloat(this.value);\
    sources.ssp.change.emit();\
    getCommAngle();\
    "}),
  hdg2 : new Bokeh.CustomJS({code:"\
    sources.vehicles.data.hdg2[0] = d2r(parseFloat(this.value));\
    sources.ssp.change.emit();\
    getCommAngle();\
    "}),
  
  slider : new Bokeh.CustomJS({code:"\
    slider_fun(this.name,this.value);\
    "}),

  match_aspect : new Bokeh.CustomJS({code:"\
    aco_plot.match_aspect = this.active.length == 1;\
    aco_plot.width = aco_plot.width + 1;\
    aco_plot.width = aco_plot.width - 1;\
    "}),
}


// Define widgets
var env = {
  depth : new Bokeh.Widgets.TextInput({
    title:"Max Depth [m]:",
    value:_init.env.max_depth.toString(),
    js_property_callbacks:{"change:value":[callbacks.depth]}}),
  c0 : new Bokeh.Widgets.TextInput({
    title:"c0 [m/s]:",
    value:_init.env.c0.toString(),
    js_property_callbacks:{"change:value":[callbacks.c0]}}),
  c_grad : new Bokeh.Widgets.TextInput({
    title:"c gradient [1/s]:",
    value:_init.env.grad.toString(),
    js_property_callbacks:{"change:value":[callbacks.c_grad]}}),
  match_aspect : new Bokeh.Widgets.CheckboxGroup({
    labels:["Match aspect ratio"],
    active:[0],
    js_property_callbacks:{"change:active":[callbacks.match_aspect]}})
}

var vehs = {
  spd1 : new Bokeh.Widgets.TextInput({
    title:"Speed, veh 1 [m/s]:",
    value:_init.veh1.spd.toString(),
    js_property_callbacks:{"change:value":[callbacks.spd1]}}),
  spd2 : new Bokeh.Widgets.TextInput({
    title:"Speed, veh 2 [m/s]:",
    value:_init.veh2.spd.toString(),
    js_property_callbacks:{"change:value":[callbacks.spd2]}}),
  hdg2 : new Bokeh.Widgets.TextInput({
    title:"Heading, veh 2 [deg]:",
    value:r2d(_init.veh2.hdg).toFixed(2).toString(),
    js_property_callbacks:{"change:value":[callbacks.hdg2]}}),  
}

// env.depth.toolbar = {tools:[]};
// env.match_aspect.toolbar = {tools:[]};

var divs = {
  env  : new Bokeh.Widgets.Div({text:"Environment Params",style:{fontWeight:"bold"}}),
  veh1 : new Bokeh.Widgets.Div({text:"Own Ship",style:{fontWeight:"bold"}}),
  veh2 : new Bokeh.Widgets.Div({text:"<br/>Collaborator",style:{fontWeight:"bold"}}),
  blank : new Bokeh.Widgets.Div({text:"",style:{width:'4em'}})
}

var sliders = {
  x1 : new Bokeh.Widgets.Slider({
    start:0,end:30000,value:_init.veh1.x,step:10,
    name:"x1",title:"X-coord, x1 [m]",
    js_property_callbacks:{"change:value_throttled":[callbacks.slider]}}),
  y1 : new Bokeh.Widgets.Slider({
    start:0,end:30000,value:_init.veh1.y,step:10,
    name:"y1",title:"Y-coord, y1 [m]",
    js_property_callbacks:{"change:value_throttled":[callbacks.slider]}}),
  z1 : new Bokeh.Widgets.Slider({
    start:0,end:_init.env.max_depth,value:_init.veh1.z,step:10,
    name:"z1",title:"Depth, z1 [m]",
    js_property_callbacks:{"change:value_throttled":[callbacks.slider]}}),
  x2 : new Bokeh.Widgets.Slider({
    start:0,end:30000,value:_init.veh2.x,step:10,
    name:"x2",title:"X-coord, x2 [m]",
    js_property_callbacks:{"change:value_throttled":[callbacks.slider]}}),
  y2 : new Bokeh.Widgets.Slider({
    start:0,end:30000,value:_init.veh2.y,step:10,
    name:"y2",title:"Y-coord, y2 [m]",
    js_property_callbacks:{"change:value_throttled":[callbacks.slider]}}),
   z2 : new Bokeh.Widgets.Slider({
    start:0,end:_init.env.max_depth,value:_init.veh2.z,step:10,
    name:"z2",title:"Depth, z2 [m]",
    js_property_callbacks:{"change:value_throttled":[callbacks.slider]}}),
  r2 : new Bokeh.Widgets.Slider({
    start:0,end:45000,value:_init.veh2.r,step:100,
    name:"r2",title:"Range, r2 [m]",
    js_property_callbacks:{"change:value_throttled":[callbacks.slider]}}),
};


// Define helper functions
function r2d (rads) {return rads*180/Math.PI;}

function d2r (degs) {return degs*Math.PI/180;}

function slider_fun (sname,sval) {
  // Get relative heading
  var data = sources.vehicles.data;
  var hdg = Math.atan2( data.x2[0]-data.x1[0], data.y2[0]-data.y1[0]);
  
  if (sname == "x1" ) {data.x1[0] = sval;}
  else if (sname == "y1" ) {data.y1[0] = sval;}
  else if (sname == "z1" ) {data.z1[0] = sval;}
  else if (sname == "x2" ) {data.x2[0] = sval;}
  else if (sname == "y2" ) {data.y2[0] = sval;}
  else if (sname == "z2" ) {data.z2[0] = sval;}  
  else if (sname == "r2" ) {
    data.x2[0] = data.x1[0] + sval*Math.sin(hdg);
    data.y2[0] = data.y1[0] + sval*Math.cos(hdg);
    sliders.x2.value = data.x2[0];
    sliders.y2.value = data.y2[0];
  }

  var range = Math.sqrt( Math.pow( data.x2[0]-data.x1[0],2)+ Math.pow(data.y2[0]-data.y1[0],2) )
  data.r2[0] = range;
  sources.env.data.r[1] = range;
  sliders.r2.value = range;
  
  sources.vehicles.change.emit();
  sources.env.change.emit();
  getCommAngle();
}

function setMaxDepth(new_depth) {
  sliders.z1.end = new_depth;
  sliders.z2.end = new_depth;
  sources.env.data.bot = [new_depth,new_depth];
  sources.env.change.emit();

  if (sliders.z1.value > new_depth) {
    sliders.z1.value = new_depth;
    sources.vehicles.data.z1[0] = new_depth;
  }
  if (sliders.z2.value > new_depth) {
    sliders.z2.value = new_depth;
    sources.vehicles.data.z2[0] = new_depth;
  }
  sources.vehicles.change.emit();

  console.log("New max depth: " + new_depth.toString());
  getCommAngle();
}

function getCommAngle () {
  // Load shorthand variables from main scope
  var r1 = sources.vehicles.data.r1[0];
  var r2 = sources.vehicles.data.r2[0];
  var z1 = sources.vehicles.data.z1[0];
  var z2 = sources.vehicles.data.z2[0];

  var c0 = parseFloat(env.c0.value);
  var grad = parseFloat(env.c_grad.value);

  // Begin calulations
  var zc = -c0/grad;

  var r3 = Math.abs(r2)/2;
  var z3 = (z1 + (z2-z1)/2);

  // Angle in veh-veh triangle
  var alpha = Math.atan2((z2-z1),(r2));
  // console.log(alpha.toString() + " rad, " + r2d(alpha).toString() + "deg");

  // Center and radius of circular acoustic path, from bisector projection
  var rc = r3+(z3-zc)*Math.tan(alpha);
  var Radius = Math.sqrt(Math.pow(rc,2)+Math.pow(z1-zc,2));
  // console.log("rc : "+rc.toString()+", R : "+Radius.toString()+""+"");

  // Ray elevation angle (upwards positive) for Tx, Rx nodes
  var thetaTx = Math.atan2(-(z1-zc),-rc);
  var thetaRx = Math.atan2(-(z2-zc),(r2-rc));

  sources.aco_path.c.data.rc = [rc];
  sources.aco_path.c.data.zc = [zc];

  sources.aco_path.geom.data.rs = [[r1,r2],[r3,rc]];
  sources.aco_path.geom.data.zs = [[z1,z2],[z3,zc]];

  // Trace path
  var thetas = Bokeh.LinAlg.linspace(thetaTx,thetaRx);

  var rs = thetas.map((thetai) => rc + Radius*(Math.cos(thetai)));
  var zs = thetas.map((thetai) => -Radius*Math.sin(thetai)-c0/grad);

  // Check if path is valid
  clearOthers();
  var z_max = Radius + zc;
  if (z_max > sources.env.data.bot[0] && rc > r1 && rc < r2){
    aco_path.glyph.line_color = 'crimson';
    document.getElementById("report1").innerHTML="\
<h3>Acoustic Path (direct)</h3>\
NOT AVAILABLE\
    ";
    getAltCommAngle();
  }
  else {
    // Use default color : #1f77b4
    aco_path.glyph.line_color = '#1f77b4';
    document.getElementById("report1").innerHTML="\
<h3>Acoustic Path (direct)</h3>\
<table> \
  <tr> <td>Radius</td>    <td> " + Radius.toFixed(2).toString() + " m </td> </tr> \
  <tr> <td>r_center</td>  <td> " + rc.toFixed(2).toString() + " m </td> </tr> \
  <tr> <td>Tx Angle</td>  <td> " + r2d(thetaTx+Math.PI/2).toFixed(2).toString() + " deg </td> </tr> \
  <tr> <td>Rx Angle</td>  <td> " + r2d(thetaRx+Math.PI/2).toFixed(2).toString() + " deg </td> </tr> \
  <tr> <td>Alpha</td>     <td> " + r2d(alpha).toFixed(2).toString() + " deg </td> </tr> \
</table> \
    ";
  }

  sources.aco_path.s.data.rs = rs;
  sources.aco_path.s.data.zs = zs;

  sources.aco_path.c.change.emit();
  sources.aco_path.geom.change.emit();
  sources.aco_path.s.change.emit();


}

function getAltCommAngle () {
  // Load shorthand variables from main scope
  var r2 = sources.vehicles.data.r2[0];
  var z2 = sources.vehicles.data.z2[0];

  var c0 = parseFloat(env.c0.value);
  var grad = parseFloat(env.c_grad.value);

  // Begin calulations
  var zc = -c0/grad;
  var Radius = sources.env.data.bot[0] - zc;

  // Angle in veh-center triangle
  var phi = Math.asin((z2-zc)/Radius);

  // Center and radius of circular acoustic path, from bisector projection
  var rc = r2 - Radius*Math.cos(phi);
  
  // Find max depth at vehicle 1, for valid comms
  var z1 = Radius*Math.cos(Math.asin(rc/Radius))+zc
  
  // Ray elevation angle (upwards positive) for Tx, Rx nodes
  var thetaTx = Math.atan2(-(z1-zc),-rc);
  var thetaRx = Math.atan2(-(z2-zc),(r2-rc));

  sources.alt_path.c.data.rc = [rc];
  sources.alt_path.c.data.zc = [zc];

  var thetas = Bokeh.LinAlg.linspace(thetaTx,thetaRx);

  var rs = thetas.map((thetai) => rc + Radius*(Math.cos(thetai)));
  var zs = thetas.map((thetai) => -Radius*Math.sin(thetai)-c0/grad);

  sources.alt_path.s.data.rs = rs;
  sources.alt_path.s.data.zs = zs;

  sources.alt_path.c.change.emit();
  sources.alt_path.s.change.emit();
  document.getElementById("report2").innerHTML="\
<h3>Acoustic Path (alternative)</h3>\
<table> \
  <tr> <td>Radius</td>    <td> " + Radius.toFixed(2).toString() + " m </td> </tr> \
  <tr> <td>r_center</td>  <td> " + rc.toFixed(2).toString() + " m </td> </tr> \
  <tr> <td>Tx Angle</td>  <td> " + r2d(thetaTx+Math.PI/2).toFixed(2).toString() + " deg </td> </tr> \
  <tr> <td>Rx Angle</td>  <td> " + r2d(thetaRx+Math.PI/2).toFixed(2).toString() + " deg </td> </tr> \
</table> \
    ";

  // Check z1 value for Comms Location strategy report
  if ( z1 < 0) {
    z1 = NaN;
  }  
  document.getElementById("report3").innerHTML="\
<h3>Comms Locations</h3>\
<h5>Strategy #1: Depth only</h5>\
<table> \
  <tr> <td>Max Depth</td>    <td> " + z1.toFixed(2).toString() + " m </td> </tr> \
</table> \
    ";
  
  getCommsLoc();
}

function getCommsLoc () {
  var ts = sources.loc.transects.data;
  var ca_r1 = sources.loc.ca_range1.data;
  var ca_r2 = sources.loc.ca_range2.data;
  var veh = sources.vehicles.data;
  
  var c0 = parseFloat(env.c0.value);
  var grad = parseFloat(env.c_grad.value);

  // Begin calulations
  var zc = -c0/grad;
  var ca_radius = sources.env.data.bot[0]-1 - zc;
  
  var ca_center_offset = Math.cos(Math.asin((veh.z2[0]-zc)/ca_radius))*ca_radius
  
  
  var tt = Bokeh.LinAlg.linspace(0,15000,3001);
  ts.x2 = tt.map((ti) => veh.x2[0] + veh.spd2[0]*Math.sin(veh.hdg2[0])*ti);
  ts.y2 = tt.map((ti) => veh.y2[0] + veh.spd2[0]*Math.cos(veh.hdg2[0])*ti);
  ts.x1 = [];
  ts.y1 = [];
  ts.z1 = [];
  
  for (var ii = 0; ii< tt.length; ii++) {
    var hh = Math.atan2(ts.x2[ii]-veh.x1[0],ts.y2[ii]-veh.y1[0])

    ca_r1.x.push(ts.x2[ii] - Math.sin(hh)*ca_center_offset)
    ca_r1.y.push(ts.y2[ii] - Math.cos(hh)*ca_center_offset)

    var dd = Math.sqrt( Math.pow(ca_r1.x[ii]-veh.x1[0],2)+Math.pow(ca_r1.y[ii]-veh.y1[0],2) )
    var dd3 = Math.sqrt(Math.pow(ca_r1.x[ii]-veh.x1[0],2) + 
                        Math.pow(ca_r1.y[ii]-veh.y1[0],2) +
                        Math.pow(veh.z1[0]-zc,2) )
    var phi2 = Math.atan2(veh.z1[0]-zc,dd);
    
    if (dd3<ca_radius) {
      // Vehicle 2 has closed the distance and made comms viable;
      // hold position
      ca_r2.x.push(veh.x1[0]);
      ca_r2.y.push(veh.y1[0]);
      ca_r2.z.push(veh.z1[0]);
    }
    else {
      var phi = Math.atan2(veh.z1[0]-zc,dd)
      var ca_center_offset2 = Math.cos(phi)*ca_radius;
      var ca_z_offset2 = Math.sin(phi)*ca_radius;

      if (ca_z_offset2+zc < 0) {
        // Force min depth to 0
        var phi = Math.asin(-zc/ca_radius);
        var ca_center_offset2 = Math.cos(phi)*ca_radius;
        var ca_z_offset2 = Math.sin(phi)*ca_radius;      
      }

      ca_r2.x.push(ts.x2[ii] - Math.sin(hh)*(ca_center_offset + ca_center_offset2 ));
      ca_r2.y.push(ts.y2[ii] - Math.cos(hh)*(ca_center_offset + ca_center_offset2 ));
      ca_r2.z.push(ca_z_offset2+zc);
      
      var dd2 = Math.sqrt( Math.pow(ca_r2.x[ii]-veh.x1[0],2)+
                          Math.pow(ca_r2.y[ii]-veh.y1[0],2) )
      
      phi2 = Math.atan2(veh.z1[0],dd2)
    }
    
    ts.x1.push(veh.x1[0] + (veh.spd1[0]*Math.cos(phi2))*Math.sin(hh)*tt[ii]);
    ts.y1.push(veh.y1[0] + (veh.spd1[0]*Math.cos(phi2))*Math.cos(hh)*tt[ii]);
    ts.z1.push(veh.z1[0] - (veh.spd1[0]*Math.sin(phi2))*tt[ii]);
    
  }


  var solutions = {time: {index:NaN,time:Infinity,range:Infinity,x:NaN,y:NaN}, 
                   range:{index:NaN,time:Infinity,range:Infinity,x:NaN,y:NaN}};

  for (var ii = 0; ii<tt.length; ii++) {
    var t_range = Math.sqrt( Math.pow(ts.x1[ii]-ca_r2.x[ii],2)+
                            Math.pow(ts.y1[ii]-ca_r2.y[ii],2) )
    var r_range = Math.sqrt( Math.pow(veh.x1[0]-ca_r2.x[ii],2)+
                            Math.pow(veh.y1[0]-ca_r2.y[ii],2) )
    var max_range = Math.sqrt( Math.pow(ts.x1[ii]-veh.x1[0],2)+
                              Math.pow(ts.y1[ii]-veh.y1[0],2) )

    if (t_range<solutions.time.range && 
        max_range>r_range && 
        tt[ii]<solutions.time.time && 
        ca_r2.z[ii]>0){
      
      solutions.time.index = ii;
      solutions.time.time  = tt[ii];
      solutions.time.range = t_range;
      solutions.time.x = ca_r2.x[ii];
      solutions.time.y = ca_r2.y[ii];
      solutions.time.z = ca_r2.z[ii];
    }
    if (r_range<solutions.range.range && 
        max_range>r_range && 
        ca_r2.z[ii]>0){
      
      solutions.range.index = ii;
      solutions.range.time  = tt[ii];
      solutions.range.range = r_range;
      solutions.range.x = ca_r2.x[ii];
      solutions.range.y = ca_r2.y[ii];
      solutions.range.z = ca_r2.z[ii];
    }
  }
  // console.log(solutions)
  sols = sources.loc.solutions.data;
  sols.x_time = [solutions.time.x];
  sols.y_time = [solutions.time.y];
  sols.z_time = [solutions.time.z];
  sols.x_range = [solutions.range.x];
  sols.y_range = [solutions.range.y];
  sols.z_range = [solutions.range.z];
  
  sources.loc.transects.change.emit();
  sources.loc.ca_range1.change.emit();
  sources.loc.ca_range2.change.emit();
  sources.loc.solutions.change.emit();

  document.getElementById("report3").innerHTML=document.getElementById("report3").innerHTML+"\
<h5>Strategy #2: Minimize distance</h5> \
<table> \
  <tr> <td>X-coord</td>    <td> " + solutions.range.x.toFixed(2).toString() + " m </td> </tr> \
  <tr> <td>Y-coord</td>    <td> " + solutions.range.y.toFixed(2).toString() + " m </td> </tr> \
  <tr> <td>Z-coord</td>    <td> " + solutions.range.z.toFixed(2).toString() + " m </td> </tr> \
  <tr> <td>Time</td>    <td> " + solutions.range.time.toFixed(2).toString() + " m </td> </tr> \
</table> \
<h5>Strategy #3: Minimize time</h5>\
<table> \
  <tr> <td>X-coord</td>    <td> " + solutions.time.x.toFixed(2).toString() + " m </td> </tr> \
  <tr> <td>Y-coord</td>    <td> " + solutions.time.y.toFixed(2).toString() + " m </td> </tr> \
  <tr> <td>Z-coord</td>    <td> " + solutions.time.z.toFixed(2).toString() + " m </td> </tr> \
  <tr> <td>Time</td>    <td> " + solutions.time.time.toFixed(2).toString() + " m </td> </tr> \
</table> \
    ";
  
}

function clearOthers() {
  sources.alt_path.c.data.rc = [];
  sources.alt_path.c.data.zc = [];
  sources.alt_path.s.data.rs = [];
  sources.alt_path.s.data.zs = [];

  sources.alt_path.c.change.emit();
  sources.alt_path.s.change.emit();

  sources.loc.transects.data = {x1:[],y1:[],x2:[],y2:[]};
  sources.loc.ca_range1.data = {x:[],y:[]};
  sources.loc.ca_range2.data = {x:[],y:[],z:[]};
  sources.loc.solutions.data = {x_time:[],y_time:[],z_time:[],
                                x_range:[],y_range:[],z_range:[]};  
  
  sources.loc.transects.change.emit();
  sources.loc.ca_range1.change.emit();
  sources.loc.ca_range2.change.emit();
  sources.loc.solutions.change.emit();
  
  document.getElementById("report2").innerHTML="\
<h3>Acoustic Path (alternative)</h3>\
NOT NEEDED\
    ";  
  document.getElementById("report3").innerHTML="\
<h3>Comms Locations</h3>\
NOT NEEDED\
    ";  
}


// Create plot/render elements
var ssp = new Bokeh.Plotting.figure({width:200})
ssp.line({field:"c"},{field:"z"},{source:sources.ssp})


var aco_plot = new Bokeh.Plotting.figure({sizing_mode:"stretch_width"})
var aco_render = []

aco_render.push(aco_plot.line({field:"r"},{field:"surf"},{source:sources.env,color:'black'}));
aco_render.push(aco_plot.line({field:"r"},{field:"bot"},{source:sources.env,color:'black'}));
aco_render.push(aco_plot.circle({field:"r1"},{field:"z1"},{source:sources.vehicles,size:8,legend:'Vehicle 1'}));
aco_render.push(aco_plot.circle({field:"r2"},{field:"z2"},{source:sources.vehicles,size:8,legend:'Vehicle 2'}));
// p_render.push(aco_plot.circle({field:"r2"},{field:"z2"},{source:sources.vehicles,size:8}));

aco_plot.circle({field:"rc"},{field:"zc"},{source:sources.aco_path.c,size:5,color:'gray'})
aco_plot.circle({field:"rc"},{field:"zc"},{source:sources.alt_path.c,size:5,color:'mediumaquamarine'})
aco_plot.multi_line({field:"rs"},{field:"zs"},{source:sources.aco_path.geom,size:5,color:'gray'})

var aco_path = aco_plot.line({field:"rs"},{field:"zs"},{source:sources.aco_path.s,legend:'Acoustic Path'})
var alt_path = aco_plot.line({field:"rs"},{field:"zs"},{source:sources.alt_path.s,legend:'Alternative Path',color:'mediumaquamarine'})


var loc_plot = new Bokeh.Plotting.figure({sizing_mode:'stretch_width'})
var loc_render = []

loc_render.push(loc_plot.circle({field:'x1'},{field:'y1'},{source:sources.vehicles,legend:'Start Position, Veh 1'}))
loc_plot.circle({field:'x2'},{field:'y2'},{source:sources.vehicles,legend:'Start Position, Veh 2'})
loc_plot.line({field:'x1'},{field:'y1'},{source:sources.loc.transects,legend:'Veh 1 (max travel)',color:'lightgray'})
loc_plot.line({field:'x2'},{field:'y2'},{source:sources.loc.transects,legend:'Vehicle 2'})
loc_plot.line({field:'x'},{field:'y'},{source:sources.loc.ca_range1,legend:'Comms Ray Center',color:'mistyrose',line_width:3})
loc_render.push(loc_plot.line({field:'x'},{field:'y'},{source:sources.loc.ca_range2,legend:'Closest Comms Point',color:'salmon'}))

loc_render.push(loc_plot.triangle({field:'x_range'},{field:'y_range'},{source:sources.loc.solutions,legend:'Range Solution'}))
loc_render.push(loc_plot.inverted_triangle({field:'x_time'},{field:'y_time'},{source:sources.loc.solutions,legend:'Time Solution'}))


// Set figure properties
ssp.y_range = aco_plot.y_range;
ssp.xaxis[0].major_label_orientation = d2r(30);
ssp.xaxis[0].axis_label = "c [m/s]";
ssp.yaxis[0].axis_label = "Depth [m]";

aco_plot.y_range.flipped = true;
aco_plot.x_range.renderers = aco_render;
aco_plot.y_range.renderers = aco_render;
aco_plot.xaxis[0].axis_label = "Range [m]";
aco_plot.yaxis[0].axis_label = "Depth [m]";

aco_plot.match_aspect = true;
aco_plot.legend.click_policy = 'hide';

loc_plot.x_range.renderers = loc_render;
loc_plot.y_range.renderers = loc_render;
loc_plot.xaxis[0].axis_label = "X-coord [m]";
loc_plot.yaxis[0].axis_label = "Y-coord [m]";

loc_plot.match_aspect = true;
loc_plot.legend.click_policy = 'hide';
loc_plot.add_layout(loc_plot.legend,'right');


// Configure layout
var cc1 = new Bokeh.Column({
  children:[divs.env,
            env.depth,
            env.c0,
            env.c_grad,
            vehs.spd1,
            vehs.spd2,
            vehs.hdg2,
            env.match_aspect
           ],
  sizing_mode:'fixed',
  width:200})
cc1.toolbar = {tools:[]}

var cc2 = new Bokeh.Column({
  children:[divs.veh1,
            sliders.x1,
            sliders.y1,
            sliders.z1,
            divs.veh2,
            sliders.x2,
            sliders.y2,
            sliders.z2,
            sliders.r2],
  sizing_mode:'stretch_width',
  width:150})
cc2.toolbar = {tools:[]}

var gp1 = Bokeh.Plotting.gridplot(
  [[ssp,aco_plot]],{sizing_mode:"stretch_width"});
var gp2 = Bokeh.Plotting.gridplot(
  [[loc_plot]],{sizing_mode:"stretch_width"});
var tab1 = new Bokeh.Panel({child:gp1,title:'ElevAngle'});
var tab2 = new Bokeh.Panel({child:gp2,title:'Intercept'});
var tabs = new Bokeh.Tabs({tabs:[tab1,tab2]});

var controls = new Bokeh.Row({children:[cc1,divs.blank,cc2],sizing_mode:"stretch_width"});
var col_all = new Bokeh.Column(
  {children:[tabs,controls],sizing_mode:'stretch_width'});


// Show plots
Bokeh.Plotting.show( col_all,document.getElementById("pCommsPlot") )


// Run with init values
getCommAngle();

