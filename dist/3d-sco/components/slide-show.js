"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const react_splide_1 = require("@splidejs/react-splide");
const framer_motion_1 = require("framer-motion");
require("@splidejs/react-splide/css");
const image_1 = __importDefault(require("next/image"));
const dialog_1 = require("./ui/dialog");
const react_1 = require("react");
const framer_motion_2 = require("framer-motion");
const SlideShow = ({ images }) => {
    const [hovering, setHovering] = (0, react_1.useState)(false);
    return (<react_splide_1.Splide options={{
            autoplay: "true",
            perPage: 1,
            start: 0,
            rewind: true,
            padding: { left: '3rem', right: '3rem' },
            gap: "1rem",
        }} hasTrack={false}>
      <react_splide_1.SplideTrack>
        {images.map((image, idx) => (<react_splide_1.SplideSlide key={idx} className="flex items-center">
            <dialog_1.Dialog>
              <dialog_1.DialogTrigger className="relative" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
                <image_1.default src={image} alt="screenshot" width={1000} height={1000} className="w-full rounded-lg h-auto"/>
                <framer_motion_2.AnimatePresence>
                  {hovering && (<framer_motion_1.motion.div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 text-white backdrop-blur-[1px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      Click to zoom
                    </framer_motion_1.motion.div>)}
                </framer_motion_2.AnimatePresence>
              </dialog_1.DialogTrigger>
              <dialog_1.DialogContent className="min-w-[90vw] h-[90vh] bg-transparent outline-none border-none p-0 m-0">
                <dialog_1.DialogHeader className="w-full">
                  {/* <DialogTitle>Are you absolutely sure?</DialogTitle> */}
                  <dialog_1.DialogDescription>
                    {image.split("/").pop()}
                  </dialog_1.DialogDescription>
                </dialog_1.DialogHeader>
                <image_1.default src={image} alt="screenshot" width={1000} height={1000} className="w-full" style={{ objectFit: "contain", width: "100vw" }}/>
              </dialog_1.DialogContent>
            </dialog_1.Dialog>
          </react_splide_1.SplideSlide>))}
      </react_splide_1.SplideTrack>
      <div className="splide__progress">
        <div className="splide__progress__bar"></div>
      </div>
    </react_splide_1.Splide>);
};
exports.default = SlideShow;
//# sourceMappingURL=slide-show.js.map