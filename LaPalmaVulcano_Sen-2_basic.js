var imageCollection2 = ee.ImageCollection("COPERNICUS/S2_SR");


//Basic for La Palma lava tracking 2021-10-03
//Displays Copernicus S2_SR (Lev. 2A) 2021-09-30 12:03:48
//CC BY 4.0 license 
//Original by I.Villanueva, Email: ivillamadrid@gmail.com
// www.ivillanueva.earth



//Palma Vulcano Area of Interest
Map.setCenter(-17.9036, 28.61779);
var Area = ee.Geometry.Point([-17.9036, 28.61779]).buffer(4.5e3);


var visPar = {
  fillColor:'b5ffb4',
  color:'00909F',
  width: 3.0,
};
Map.addLayer(Area, visPar, "La Palma Vulcano");


//PARAMETERS

var CLOUD_FILTER=15;
var Threshold=-0.6;       

//PERIOD

var startPeriod = ee.Date('2021-09-30'); // Starting date
var endPeriod = ee.Date('2021-10-02');   // Ending date




function AddBand_MND(image) {
  var mnd = image.normalizedDifference(['B4', 'B11']) // MNDWI B3-B11
            .rename('mnd') // NIR(8)-Red(4)  //NDVI=NIR(8)-Red(4)
            .clip(Area);
  return image.addBands([mnd]);
}



function UnderThreshold(image) {
  var F1=image.select('mnd').lte(Threshold);
  var F2=image.select('mnd').mask(F1);
  
  return F2;
  
}  


//Image Collection

var Img2A = ee.ImageCollection("COPERNICUS/S2_SR")
        .filterDate(startPeriod, endPeriod)
        .filterBounds(Area)
        .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', CLOUD_FILTER))
        .sort('system:time_start', true);
        //.sort('CLOUDY_PIXEL_PERCENTAGE', true)
        
        

// List
var list = ee.List(Img2A.aggregate_array("system:time_start")).map(function(d) { return ee.Date(d)});
print('Copernicus S2_SR (Lev. 2A) images of the area during the study period', list);



// Display

var Msel_Opt = Img2A.reduce(ee.Reducer.max()).clip(Area); 
 
var waterPalette = ['red', 'yellow', 'cyan', 'blue'];
var TrueColor_sentinel2 = {bands: ['B4_max', 'B3_max', 'B2_max'], min: 0, max: 3000}; //Natural
var Redshift_sentinel2 = {bands: ['B8_max', 'B4_max', 'B3_max'], min: 0, max: 3000}; //-> IR 
var Redshift_sentinel3 = {bands: ['B12_max', 'B11_max', 'B8A_max'], min: 0, max: 3000}; //-> B4 verde, B8A azules

Map.addLayer(Msel_Opt, TrueColor_sentinel2, 'Msel-Opt True');
Map.addLayer(Msel_Opt, Redshift_sentinel2, 'Msel-Opt Reds');
Map.addLayer(Msel_Opt, Redshift_sentinel3, 'Msel-Opt Blues');


//Modified ND

var Img2A_MND=Img2A.map(AddBand_MND)
                .map(UnderThreshold);
                
var MaxD_MND=Img2A_MND.reduce(ee.Reducer.min()).clip(Area) ;
Map.addLayer(MaxD_MND,{min: -1, max: 1., palette: waterPalette, bands:['mnd_min']}, 'ModND');
