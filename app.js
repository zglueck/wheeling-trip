(() => {

    const tracks = [
        './tracks/hancock.xml',
        './tracks/taylor.xml',
        './tracks/pearl.xml',
        './tracks/schofield.xml'
    ];

    const wwd = new WorldWind.WorldWindow('globe');

    const bing = new WorldWind.BMNGLandsatLayer();
    bing.detailControl = 1.25;
    wwd.addLayer(bing);
    wwd.addLayer(new WorldWind.StarFieldLayer());
    const trailsLayer = new WorldWind.RenderableLayer('Trails Layer');
    wwd.addLayer(trailsLayer);

    const parseGpx = xml => {

        const parseTrkSeg = element => {
            const children = element.children, locations = [], shapeAttrs = new WorldWind.ShapeAttributes();
            let lat, lon;

            shapeAttrs.outlineWidth = 3;

            for (let i = 0; i < children.length; i++) {
                let child = children[i];

                if (child.localName === 'trkpt') {
                    lat = child.getAttribute('lat');
                    lon = child.getAttribute('lon');
                    locations.push(new WorldWind.Location(lat, lon));
                }
            }

            const path = new WorldWind.SurfacePolyline(locations, shapeAttrs);
            trailsLayer.addRenderable(path);
        };

        const parseTrk = element => {
            const children = element.children;

            for (let i = 0; i < children.length; i++) {
                let child = children[i];

                if (child.localName === 'trkseg') {
                    parseTrkSeg(child);
                }
            }
        };

        const parseGpxRoot = element => {
            const children = element.children;

            for (let i = 0; i < children.length; i++) {
                let child = children[i], lat, lon, label, placemark, attrs;

                const baseAttrs = new WorldWind.PlacemarkAttributes();
                baseAttrs.imageSource = './images/wheel.png';
                baseAttrs.imageOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_FRACTION, 0.5,
                    WorldWind.OFFSET_FRACTION, 0
                );

                if (child.localName === 'wpt') {
                    lat = child.getAttribute('lat');
                    lon = child.getAttribute('lon');
                    label = child.children[0].textContent;
                    attrs = new WorldWind.PlacemarkAttributes(baseAttrs);
                    placemark = new WorldWind.Placemark(new WorldWind.Location(lat, lon), attrs);
                    placemark.altitudeMode = WorldWind.CLAMP_TO_GROUND;
                    placemark.label = label;
                    trailsLayer.addRenderable(placemark);
                } else if (child.localName === 'trk') {
                    parseTrk(child);
                }
            }
        };

        const parseRoot = element => {
            const children = element.children;

            for (let i = 0; i < children.length; i++) {
                if (children[i].localName === 'gpx') {
                    parseGpxRoot(children[i]);
                }
            }
        };
        
        parseRoot(xml);
    };

    const fetchAndParseTracks = url => {
        fetch(url)
            .then(response => response.text())
            .then(text => new DOMParser().parseFromString(text, 'text/xml'))
            .then(dom => parseGpx(dom))
            .catch(e => alert(e));
    };

    const addLayers = () => {
        const serviceAddress = 'https://tiles.maps.eox.at/wms?service=wms&request=getcapabilities';
        fetch(serviceAddress)
            .then(response => response.text())
            .then(text => new DOMParser().parseFromString(text, 'text/xml'))
            .then(xml => new WorldWind.WmsCapabilities(xml))
            .then(caps => {
                const layers = caps.getNamedLayers();
                layers.forEach(layer => {
                    if (layer.name === 'overlay_base_bright') {
                        const config = WorldWind.WmsLayer.formLayerConfiguration(layer);
                        const wmsLayer = new WorldWind.WmsLayer(config);
                        wwd.addLayer(wmsLayer);
                    }
                });
            });
    };

    addLayers();

    for (let i = 0; i < tracks.length; i++) {
        fetchAndParseTracks(tracks[i]);
    }

})();