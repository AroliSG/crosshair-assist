import { useEffect, useState } from 'react';
import convertToBase64 from '../utils/base64';
import { Color, hexToRgb, Solver } from '../utils/colors';
import { ImageTypes } from '../utils/types';

/*

    adding keybinds
    need to store it too
    last thing before publishing
*/

const Landing = () => {
  const [getKeybind, setKeybind]          = useState ({ key1:null,key2:null,key3:null });
  const [getKeyEnabled, setKeyEnabled]    = useState (false);
  const [getMoveHud, setMoveHud]          = useState ({x:0,y:0});
  const [getMoveSpeed, setMoveSpeed]      = useState (5);

  const [getBase64Image, setBase64Image]  = useState <any[]> ([0,1,2,3,4]);
  const [getItemClicked, setItemClicked]  = useState (0);

  const [getSizeRange, setSizeRange]      = useState (0);
  const [getImageColor, setImageColor]    = useState ("blur(0%)");
  const [getColorRGB, setColorRGB]        = useState ({
    r: 0,
    g: 0,
    b: 0
  });


  useEffect (() => {
      // scaling image
    window.electron.invoke ("getScale", "").then ((scale) => {
      setSizeRange(parseInt (scale,10));
    });

      // coords
    window.electron.invoke ("getCoords", "").then ((coords) => {
      setMoveHud(coords);
    });

      // image base64
    window.electron.invoke ("getImages", "").then ((images) => {
        // concat
        // merging 2 arrays
        // one if from the back-end which contains image base64 and the originals
      const dt = getBase64Image.concat (images);
      setBase64Image (dt);
    });
  }, []);

  const ImageView = (props: ImageTypes) => {
    const {
      index,
      base64
    } = props;

    return (
      <div
        className   = 'single_img_container_landing'
        style       = {{
          backgroundColor: getItemClicked === index? 'var(--box)' : 'transparent',
        }}
        onDoubleClick = {() => {
            // making sure only the base64 is being removed
          if (typeof base64 === "string") {
            window.electron.send("storeImage", `remove|${base64}`);
            setBase64Image (prev => prev.filter (item => item !== base64));
          }
        }}

        onClick       = {evt => {
          setItemClicked (index);
          window.electron.send('images', base64 + "|" + getImageColor)
        }}
      >
        <img
          alt       = 'hud'
          className = 'landing_img'
          src       = {typeof base64 === 'string' ? base64 : require(`../img/reticle-${index}.png`)}
          style = {{
            filter: getImageColor
          }}
        />
      </div>
    )
  }

  const onImageUploaded = (evt: React.ChangeEvent<HTMLInputElement>) => {
    let img = new Image ();
    let url = window.URL;
    convertToBase64 (evt.target.files![0])
      .then ((base64) => {
        img.onload = () => {
          if (img.height > 64 || img.width > 64) {
            alert("Your image is too big, recommended is 64x64")
          }
          else {
            setBase64Image (prev => {
                // is image is duplicated we wont add it again!
              if (prev.findIndex (item => item === base64) !== -1) {
                alert("Your image is duplicated, can't handle it.");
                return prev;
              }

                // adding new image;
              return [...prev, base64]
            });

              // removing image from cpu
            img.remove ();
          }
        }
        img.onerror = () => {
          alert("Is this an image? can't handle this file!.");

            // removing image from cpu
          img.remove ();
        }

        img.src = url.createObjectURL (evt.target.files![0]);
      })
      .catch (error => {
        console.log (error)
      })
  }

  const moveIt = (aim: "y"|"x", percent: number) => {
    setMoveHud (move => {
      window.electron.send("moveIt", `${aim === "x" ? move.x+percent : move.x}|${aim === "y" ? move.y+percent : move.y}`);
      return {
        ...move,
        [aim]: (move[aim]+percent)
      };
    })
  }

  return (
    <div className = "landing_container">
      <div className='landing_container_image'>
        <div className = 'img-container'>
          {getBase64Image.map ((data,index) => <ImageView index = {index} base64 = {data} />)}
        </div>
        <div className='comp_container'>
          <input className='file_input_landing' type={'file'} onChange = {onImageUploaded} accept="image/*"/>
          <p className = 'landing_title' style={{ marginTop: "5px" }}>Offset manager</p>
          <div style={{display:'flex'}}>
            <div className='landing_arrow_box'>
              <i className='fa fa-arrow-up' onClick={() => moveIt ('y', -getMoveSpeed)}></i>
              <i className='fa fa-arrow-down' onClick={() => moveIt ('y', getMoveSpeed)}></i>

              <i className='fa fa-arrow-left' onClick={() => moveIt ('x', -getMoveSpeed)}></i>
              <i className='fa fa-arrow-right' onClick={() => moveIt ('x', getMoveSpeed)}></i>
            </div>

            <div style={{marginInline: "5px"}}>
              <p className = 'landing_title' style={{ marginTop: "5px" }}>Coordinates</p>
              <p className = 'display_body' style={{ marginTop: "5px" }}> - Vertically: {getMoveHud.x}px</p>
              <p className = 'display_body' style={{ marginTop: "5px" }}> - Horizontally: {getMoveHud.y}px</p>
            </div>
          </div>
          <div style={{
            display: 'flex',
            justifyContent:'space-between'
          }}>
            <button onClick={() => {
                // resetting pos too
              window.electron.send("moveIt", `0|0`);
                // resetting hud inputs
              setMoveHud ({x:0,y:0});
            }}>Reset coords</button>
            <p className = 'landing_title' style={{ marginTop: "5px" }}>Speed: {getMoveSpeed}</p>
          </div>

          <input
              style={{
                width:'100%'
              }}
              max       = {10}
              min       = {1}
              step      = {0.1}
              type      = {'range'}
              value     = {getMoveSpeed}
              onChange  = {evt => {
                const range = parseInt (evt.target.value, 10);
                setMoveSpeed (range);
              }}
            />
        </div>
      </div>

      <div className='landing_bottom_container'>
        <div className='landing_bottom_items'>
          <p className='landing_title'>Hud Color</p>
          <div className = "landing_bottom_container" style={{
            margin: 0,
            justifyContent:'center',
            alignItems:'center',
          }}>
            <input
              className = 'landing_square_picker'
              type      = {'color'}
              onChange   = {(evt) => {
                const color                          = new Color (evt.target.value);
                const solver                         = new Solver(color);
                const filter                         = solver.filter ();
                const rgb                            = hexToRgb (evt.target.value)!;

                  // changing label rgb range
                setColorRGB ({
                  r: rgb[0],
                  g: rgb[1],
                  b: rgb[2],
                });

                  // changing real time image color
                setImageColor(filter);

                  // changing hud color on the other window
                window.electron.send('images', getItemClicked + "|" + filter)
              }}
            />
            <p className='landing_title' style={{margin: 5}}>R: {getColorRGB.r}</p>
            <p className='landing_title' style={{margin: 5}}>G: {getColorRGB.g}</p>
            <p className='landing_title' style={{margin: 5}}>B: {getColorRGB.b}</p>
          </div>
        </div>
        <div className='landing_bottom_items' style={{
          marginInlineStart: '10px'
        }}>
          <p className='landing_title' style={{
             marginInlineStart: '10px'
          }}>Hud Scale ({getSizeRange})</p>
          <input
            style={{
              width:'100%'
            }}
            max       = {5}
            min       = {1}
            step      = {0.1}
            type      = {'range'}
            value     = {getSizeRange}
            onChange  = {evt => {
              const range = parseFloat (evt.target.value);
              setSizeRange (range);

              window.electron.send ("bigify", range.toString ());
            }}
          />
        </div>
      </div>
      <div className='landing_bottom_container' style = {{
        flexDirection: 'column',
        marginTop: '10px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <p className='landing_title'>Hot Key - [Disabled]</p>
          <input type={'checkbox'}/>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '5px'
        }}>
            <button>unbind</button>
            <button>unbind</button>
            <button>unbind</button>
        </div>
        <button>RESET KEY BINDS</button>
      </div>
    </div>
  );
}

export default Landing;
