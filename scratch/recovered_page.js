(() => {
  var a = {};
  ((a.id = 2755),
    (a.ids = [2755]),
    (a.modules = {
      261: (a) => {
        "use strict";
        a.exports = require("next/dist/shared/lib/router/utils/app-paths");
      },
      3295: (a) => {
        "use strict";
        a.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");
      },
      7787: (a, b, c) => {
        "use strict";
        c.d(b, { A: () => n });
        var d = c(7372),
          e = c.n(d),
          f = c(91770),
          g = c(46164),
          h = c(21124);
        let i = ({ transition: a, ...b }) =>
          (0, h.jsx)(f.A, { ...b, transition: (0, g.A)(a) });
        i.displayName = "TabContainer";
        var j = c(31983),
          k = c(56738);
        let l = {
            eventKey: e().oneOfType([e().string, e().number]),
            title: e().node.isRequired,
            disabled: e().bool,
            tabClassName: e().string,
            tabAttrs: e().object,
          },
          m = () => {
            throw Error(
              "ReactBootstrap: The `Tab` component is not meant to be rendered! It's an abstract component that is only valid as a direct Child of the `Tabs` Component. For custom tabs components use TabPane and TabsContainer directly",
            );
          };
        m.propTypes = l;
        let n = Object.assign(m, { Container: i, Content: j.A, Pane: k.A });
      },
      10846: (a) => {
        "use strict";
        a.exports = require("next/dist/compiled/next-server/app-page.runtime.prod.js");
      },
      16002: (a, b, c) => {
        "use strict";
        c.d(b, { A: () => w });
        var d = c(68813),
          e = c.n(d),
          f = c(38301),
          g = c(67971),
          h = c(21124);
        let i = f.forwardRef(
          ({ className: a, bsPrefix: b, as: c = "div", ...d }, f) => (
            (b = (0, g.oU)(b, "card-body")),
            (0, h.jsx)(c, { ref: f, className: e()(a, b), ...d })
          ),
        );
        i.displayName = "CardBody";
        let j = f.forwardRef(
          ({ className: a, bsPrefix: b, as: c = "div", ...d }, f) => (
            (b = (0, g.oU)(b, "card-footer")),
            (0, h.jsx)(c, { ref: f, className: e()(a, b), ...d })
          ),
        );
        j.displayName = "CardFooter";
        var k = c(27621);
        let l = f.forwardRef(
          ({ bsPrefix: a, className: b, as: c = "div", ...d }, i) => {
            let j = (0, g.oU)(a, "card-header"),
              l = (0, f.useMemo)(() => ({ cardHeaderBsPrefix: j }), [j]);
            return (0, h.jsx)(k.A.Provider, {
              value: l,
              children: (0, h.jsx)(c, { ref: i, ...d, className: e()(b, j) }),
            });
          },
        );
        l.displayName = "CardHeader";
        let m = f.forwardRef(
          (
            { bsPrefix: a, className: b, variant: c, as: d = "img", ...f },
            i,
          ) => {
            let j = (0, g.oU)(a, "card-img");
            return (0, h.jsx)(d, {
              ref: i,
              className: e()(c ? `${j}-${c}` : j, b),
              ...f,
            });
          },
        );
        m.displayName = "CardImg";
        let n = f.forwardRef(
          ({ className: a, bsPrefix: b, as: c = "div", ...d }, f) => (
            (b = (0, g.oU)(b, "card-img-overlay")),
            (0, h.jsx)(c, { ref: f, className: e()(a, b), ...d })
          ),
        );
        n.displayName = "CardImgOverlay";
        let o = f.forwardRef(
          ({ className: a, bsPrefix: b, as: c = "a", ...d }, f) => (
            (b = (0, g.oU)(b, "card-link")),
            (0, h.jsx)(c, { ref: f, className: e()(a, b), ...d })
          ),
        );
        o.displayName = "CardLink";
        var p = c(90565);
        let q = (0, p.A)("h6"),
          r = f.forwardRef(
            ({ className: a, bsPrefix: b, as: c = q, ...d }, f) => (
              (b = (0, g.oU)(b, "card-subtitle")),
              (0, h.jsx)(c, { ref: f, className: e()(a, b), ...d })
            ),
          );
        r.displayName = "CardSubtitle";
        let s = f.forwardRef(
          ({ className: a, bsPrefix: b, as: c = "p", ...d }, f) => (
            (b = (0, g.oU)(b, "card-text")),
            (0, h.jsx)(c, { ref: f, className: e()(a, b), ...d })
          ),
        );
        s.displayName = "CardText";
        let t = (0, p.A)("h5"),
          u = f.forwardRef(
            ({ className: a, bsPrefix: b, as: c = t, ...d }, f) => (
              (b = (0, g.oU)(b, "card-title")),
              (0, h.jsx)(c, { ref: f, className: e()(a, b), ...d })
            ),
          );
        u.displayName = "CardTitle";
        let v = f.forwardRef(
          (
            {
              bsPrefix: a,
              className: b,
              bg: c,
              text: d,
              border: f,
              body: j = !1,
              children: k,
              as: l = "div",
              ...m
            },
            n,
          ) => {
            let o = (0, g.oU)(a, "card");
            return (0, h.jsx)(l, {
              ref: n,
              ...m,
              className: e()(
                b,
                o,
                c && `bg-${c}`,
                d && `text-${d}`,
                f && `border-${f}`,
              ),
              children: j ? (0, h.jsx)(i, { children: k }) : k,
            });
          },
        );
        v.displayName = "Card";
        let w = Object.assign(v, {
          Img: m,
          Title: u,
          Subtitle: r,
          Body: i,
          Link: o,
          Text: s,
          Header: l,
          Footer: j,
          ImgOverlay: n,
        });
      },
      16715: (a, b, c) => {
        "use strict";
        c.d(b, { A: () => j });
        var d = c(68813),
          e = c.n(d),
          f = c(38301),
          g = c(67971),
          h = c(21124);
        let i = f.forwardRef(
          (
            {
              bsPrefix: a,
              className: b,
              striped: c,
              bordered: d,
              borderless: f,
              hover: i,
              size: j,
              variant: k,
              responsive: l,
              ...m
            },
            n,
          ) => {
            let o = (0, g.oU)(a, "table"),
              p = e()(
                b,
                o,
                k && `${o}-${k}`,
                j && `${o}-${j}`,
                c &&
                  `${o}-${"string" == typeof c ? `striped-${c}` : "striped"}`,
                d && `${o}-bordered`,
                f && `${o}-borderless`,
                i && `${o}-hover`,
              ),
              q = (0, h.jsx)("table", { ...m, className: p, ref: n });
            if (l) {
              let a = `${o}-responsive`;
              return (
                "string" == typeof l && (a = `${a}-${l}`),
                (0, h.jsx)("div", { className: a, children: q })
              );
            }
            return q;
          },
        );
        i.displayName = "Table";
        let j = i;
      },
      19121: (a) => {
        "use strict";
        a.exports = require("next/dist/server/app-render/action-async-storage.external.js");
      },
      22596: (a, b, c) => {
        Promise.resolve().then(c.bind(c, 75133));
      },
      23862: (a, b, c) => {
        "use strict";
        c.d(b, { A: () => e });
        var d = c(38301);
        function e(a) {
          let b = (function (a) {
            let b = (0, d.useRef)(a);
            return ((b.current = a), b);
          })(a);
          (0, d.useEffect)(() => () => b.current(), []);
        }
      },
      26713: (a) => {
        "use strict";
        a.exports = require("next/dist/shared/lib/router/utils/is-bot");
      },
      28326: (a, b, c) => {
        "use strict";
        c.d(b, { A: () => j });
        var d = c(68813),
          e = c.n(d),
          f = c(38301),
          g = c(67971),
          h = c(21124);
        let i = f.forwardRef(
          (
            {
              bsPrefix: a,
              variant: b,
              animation: c = "border",
              size: d,
              as: f = "div",
              className: i,
              ...j
            },
            k,
          ) => {
            a = (0, g.oU)(a, "spinner");
            let l = `${a}-${c}`;
            return (0, h.jsx)(f, {
              ref: k,
              ...j,
              className: e()(i, l, d && `${l}-${d}`, b && `text-${b}`),
            });
          },
        );
        i.displayName = "Spinner";
        let j = i;
      },
      28354: (a) => {
        "use strict";
        a.exports = require("util");
      },
      29294: (a) => {
        "use strict";
        a.exports = require("next/dist/server/app-render/work-async-storage.external.js");
      },
      31983: (a, b, c) => {
        "use strict";
        c.d(b, { A: () => j });
        var d = c(38301),
          e = c(68813),
          f = c.n(e),
          g = c(67971),
          h = c(21124);
        let i = d.forwardRef(
          ({ className: a, bsPrefix: b, as: c = "div", ...d }, e) => (
            (b = (0, g.oU)(b, "tab-content")),
            (0, h.jsx)(c, { ref: e, className: f()(a, b), ...d })
          ),
        );
        i.displayName = "TabContent";
        let j = i;
      },
      33873: (a) => {
        "use strict";
        a.exports = require("path");
      },
      41025: (a) => {
        "use strict";
        a.exports = require("next/dist/server/app-render/dynamic-access-async-storage.external.js");
      },
      41156: (a, b, c) => {
        Promise.resolve().then(c.bind(c, 70520));
      },
      46164: (a, b, c) => {
        "use strict";
        c.d(b, { A: () => f });
        var d = c(69213),
          e = c(97141);
        function f(a) {
          return "boolean" == typeof a ? (a ? e.A : d.default) : a;
        }
      },
      56738: (a, b, c) => {
        "use strict";
        c.d(b, { A: () => o });
        var d = c(68813),
          e = c.n(d),
          f = c(38301),
          g = c(30447),
          h = c(85988),
          i = c(78221),
          j = c(67971),
          k = c(97141),
          l = c(46164),
          m = c(21124);
        let n = f.forwardRef(({ bsPrefix: a, transition: b, ...c }, d) => {
          let [
              { className: f, as: n = "div", ...o },
              {
                isActive: p,
                onEnter: q,
                onEntering: r,
                onEntered: s,
                onExit: t,
                onExiting: u,
                onExited: v,
                mountOnEnter: w,
                unmountOnExit: x,
                transition: y = k.A,
              },
            ] = (0, i.useTabPanel)({ ...c, transition: (0, l.A)(b) }),
            z = (0, j.oU)(a, "tab-pane");
          return (0, m.jsx)(h.default.Provider, {
            value: null,
            children: (0, m.jsx)(g.default.Provider, {
              value: null,
              children: (0, m.jsx)(y, {
                in: p,
                onEnter: q,
                onEntering: r,
                onEntered: s,
                onExit: t,
                onExiting: u,
                onExited: v,
                mountOnEnter: w,
                unmountOnExit: x,
                children: (0, m.jsx)(n, {
                  ...o,
                  ref: d,
                  className: e()(f, z, p && "active"),
                }),
              }),
            }),
          });
        });
        n.displayName = "TabPane";
        let o = n;
      },
      63033: (a) => {
        "use strict";
        a.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");
      },
      70520: (a, b, c) => {
        "use strict";
        (c.r(b), c.d(b, { default: () => d }));
        let d = (0, c(97954).registerClientReference)(
          function () {
            throw Error(
              "Attempted to call the default export of \"/app/src/app/(apps layout)/admin/config/page.jsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.",
            );
          },
          "/app/src/app/(apps layout)/admin/config/page.jsx",
          "default",
        );
      },
      75133: (a, b, c) => {
        "use strict";
        (c.r(b), c.d(b, { default: () => ax }));
        var d = c(21124),
          e = c(38301),
          f = c.n(e),
          g = c(52408),
          h = c(28326),
          i = c(81483),
          j = c(43321),
          k = c(77783),
          l = c(43738),
          m = c(91770),
          n = c(68102),
          o = c(21450),
          p = c(22085),
          q = c(31983),
          r = c(56738),
          s = c(42568),
          t = c(46164);
        function u(a) {
          let {
            title: b,
            eventKey: c,
            disabled: e,
            tabClassName: f,
            tabAttrs: g,
            id: h,
          } = a.props;
          return null == b
            ? null
            : (0, d.jsx)(p.A, {
                as: "li",
                role: "presentation",
                children: (0, d.jsx)(o.A, {
                  as: "button",
                  type: "button",
                  eventKey: c,
                  disabled: e,
                  id: h,
                  className: f,
                  ...g,
                  children: b,
                }),
              });
        }
        let v = (a) => {
          let {
            id: b,
            onSelect: c,
            transition: e,
            mountOnEnter: f = !1,
            unmountOnExit: g = !1,
            variant: h = "tabs",
            children: i,
            activeKey: j = (function (a) {
              let b;
              return (
                (0, s.jJ)(a, (a) => {
                  null == b && (b = a.props.eventKey);
                }),
                b
              );
            })(i),
            ...k
          } = (0, l.Zw)(a, { activeKey: "onSelect" });
          return (0, d.jsxs)(m.A, {
            id: b,
            activeKey: j,
            onSelect: c,
            transition: (0, t.A)(e),
            mountOnEnter: f,
            unmountOnExit: g,
            children: [
              (0, d.jsx)(n.A, {
                id: b,
                ...k,
                role: "tablist",
                as: "ul",
                variant: h,
                children: (0, s.Tj)(i, u),
              }),
              (0, d.jsx)(q.A, {
                children: (0, s.Tj)(i, (a) => {
                  let b = { ...a.props };
                  return (
                    delete b.title,
                    delete b.disabled,
                    delete b.tabClassName,
                    delete b.tabAttrs,
                    (0, d.jsx)(r.A, { ...b })
                  );
                }),
              }),
            ],
          });
        };
        v.displayName = "Tabs";
        var w = c(7787),
          x = c(96129),
          y = c(16002),
          z = c(59376),
          A = c(57531),
          B = c(16715),
          C = c(40396),
          D = c(89626),
          E = c(97941),
          F = ["size", "color"];
        function G(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, F);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-settings",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("path", {
              d: "M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z",
            }),
            f().createElement("circle", { cx: "12", cy: "12", r: "3" }),
          );
        }
        var H = ["size", "color"];
        function I(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, H);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-user",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("circle", { cx: "12", cy: "7", r: "4" }),
            f().createElement("path", {
              d: "M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2",
            }),
          );
        }
        var J = ["size", "color"];
        function K(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, J);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-eye-off",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("line", { x1: "3", y1: "3", x2: "21", y2: "21" }),
            f().createElement("path", {
              d: "M10.584 10.587a2 2 0 0 0 2.828 2.83",
            }),
            f().createElement("path", {
              d: "M9.363 5.365a9.466 9.466 0 0 1 2.637 -.365c4 0 7.333 2.333 10 7c-.778 1.361 -1.612 2.524 -2.503 3.488m-2.14 1.861c-1.631 1.1 -3.415 1.651 -5.357 1.651c-4 0 -7.333 -2.333 -10 -7c1.369 -2.395 2.913 -4.175 4.632 -5.341",
            }),
          );
        }
        var L = ["size", "color"];
        function M(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, L);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-eye",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("circle", { cx: "12", cy: "12", r: "2" }),
            f().createElement("path", {
              d: "M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7",
            }),
          );
        }
        var N = ["size", "color"];
        function O(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, N);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-device-floppy",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("path", {
              d: "M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2",
            }),
            f().createElement("circle", { cx: "12", cy: "14", r: "2" }),
            f().createElement("polyline", { points: "14 4 14 8 8 8 8 4" }),
          );
        }
        var P = ["size", "color"];
        function Q(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, P);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-cpu",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("rect", {
              x: "5",
              y: "5",
              width: "14",
              height: "14",
              rx: "1",
            }),
            f().createElement("path", { d: "M9 9h6v6h-6z" }),
            f().createElement("path", { d: "M3 10h2" }),
            f().createElement("path", { d: "M3 14h2" }),
            f().createElement("path", { d: "M10 3v2" }),
            f().createElement("path", { d: "M14 3v2" }),
            f().createElement("path", { d: "M21 10h-2" }),
            f().createElement("path", { d: "M21 14h-2" }),
            f().createElement("path", { d: "M14 21v-2" }),
            f().createElement("path", { d: "M10 21v-2" }),
          );
        }
        var R = ["size", "color"];
        function S(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, R);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className:
                  "icon icon-tabler icon-tabler-adjustments-horizontal",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("circle", { cx: "14", cy: "6", r: "2" }),
            f().createElement("line", { x1: "4", y1: "6", x2: "12", y2: "6" }),
            f().createElement("line", { x1: "16", y1: "6", x2: "20", y2: "6" }),
            f().createElement("circle", { cx: "8", cy: "12", r: "2" }),
            f().createElement("line", { x1: "4", y1: "12", x2: "6", y2: "12" }),
            f().createElement("line", {
              x1: "10",
              y1: "12",
              x2: "20",
              y2: "12",
            }),
            f().createElement("circle", { cx: "17", cy: "18", r: "2" }),
            f().createElement("line", {
              x1: "4",
              y1: "18",
              x2: "15",
              y2: "18",
            }),
            f().createElement("line", {
              x1: "19",
              y1: "18",
              x2: "20",
              y2: "18",
            }),
          );
        }
        var T = ["size", "color"];
        function U(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, T);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-message",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("path", {
              d: "M4 21v-13a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-9l-4 4",
            }),
            f().createElement("line", { x1: "8", y1: "9", x2: "16", y2: "9" }),
            f().createElement("line", {
              x1: "8",
              y1: "13",
              x2: "14",
              y2: "13",
            }),
          );
        }
        var V = ["size", "color"];
        function W(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, V);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-rotate",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("path", {
              d: "M19.95 11a8 8 0 1 0 -.5 4m.5 5v-5h-5",
            }),
          );
        }
        var X = ["size", "color"];
        function Y(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, X);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-map-pin",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("circle", { cx: "12", cy: "11", r: "3" }),
            f().createElement("path", {
              d: "M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z",
            }),
          );
        }
        var Z = ["size", "color"];
        function $(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, Z);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-gift",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("rect", {
              x: "3",
              y: "8",
              width: "18",
              height: "4",
              rx: "1",
            }),
            f().createElement("line", {
              x1: "12",
              y1: "8",
              x2: "12",
              y2: "21",
            }),
            f().createElement("path", {
              d: "M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7",
            }),
            f().createElement("path", {
              d: "M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5",
            }),
          );
        }
        var _ = ["size", "color"];
        function aa(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, _);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-book",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("path", {
              d: "M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0",
            }),
            f().createElement("path", {
              d: "M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0",
            }),
            f().createElement("line", { x1: "3", y1: "6", x2: "3", y2: "19" }),
            f().createElement("line", {
              x1: "12",
              y1: "6",
              x2: "12",
              y2: "19",
            }),
            f().createElement("line", {
              x1: "21",
              y1: "6",
              x2: "21",
              y2: "19",
            }),
          );
        }
        var ab = ["size", "color"];
        function ac(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, ab);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-archive",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("rect", {
              x: "3",
              y: "4",
              width: "18",
              height: "4",
              rx: "2",
            }),
            f().createElement("path", {
              d: "M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-10",
            }),
            f().createElement("line", {
              x1: "10",
              y1: "12",
              x2: "14",
              y2: "12",
            }),
          );
        }
        var ad = ["size", "color"];
        function ae(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, ad);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-credit-card",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("rect", {
              x: "3",
              y: "5",
              width: "18",
              height: "14",
              rx: "3",
            }),
            f().createElement("line", {
              x1: "3",
              y1: "10",
              x2: "21",
              y2: "10",
            }),
            f().createElement("line", {
              x1: "7",
              y1: "15",
              x2: "7.01",
              y2: "15",
            }),
            f().createElement("line", {
              x1: "11",
              y1: "15",
              x2: "13",
              y2: "15",
            }),
          );
        }
        var af = ["size", "color"];
        function ag(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, af);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-photo",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("line", {
              x1: "15",
              y1: "8",
              x2: "15.01",
              y2: "8",
            }),
            f().createElement("rect", {
              x: "4",
              y: "4",
              width: "16",
              height: "16",
              rx: "3",
            }),
            f().createElement("path", { d: "M4 15l4 -4a3 5 0 0 1 3 0l5 5" }),
            f().createElement("path", { d: "M14 14l1 -1a3 5 0 0 1 3 0l2 2" }),
          );
        }
        var ah = ["size", "color"];
        function ai(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, ah);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-plus",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("line", {
              x1: "12",
              y1: "5",
              x2: "12",
              y2: "19",
            }),
            f().createElement("line", {
              x1: "5",
              y1: "12",
              x2: "19",
              y2: "12",
            }),
          );
        }
        var aj = ["size", "color"];
        function ak(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, aj);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-pencil",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("path", {
              d: "M4 20h4l10.5 -10.5a1.5 1.5 0 0 0 -4 -4l-10.5 10.5v4",
            }),
            f().createElement("line", {
              x1: "13.5",
              y1: "6.5",
              x2: "17.5",
              y2: "10.5",
            }),
          );
        }
        var al = ["size", "color"];
        function am(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, al);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-trash",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("line", { x1: "4", y1: "7", x2: "20", y2: "7" }),
            f().createElement("line", {
              x1: "10",
              y1: "11",
              x2: "10",
              y2: "17",
            }),
            f().createElement("line", {
              x1: "14",
              y1: "11",
              x2: "14",
              y2: "17",
            }),
            f().createElement("path", {
              d: "M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12",
            }),
            f().createElement("path", {
              d: "M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3",
            }),
          );
        }
        var an = ["size", "color"];
        function ao(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, an);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-file-text",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("path", { d: "M14 3v4a1 1 0 0 0 1 1h4" }),
            f().createElement("path", {
              d: "M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z",
            }),
            f().createElement("line", { x1: "9", y1: "9", x2: "10", y2: "9" }),
            f().createElement("line", {
              x1: "9",
              y1: "13",
              x2: "15",
              y2: "13",
            }),
            f().createElement("line", {
              x1: "9",
              y1: "17",
              x2: "15",
              y2: "17",
            }),
          );
        }
        var ap = ["size", "color"];
        function aq(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, ap);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-volume",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("path", { d: "M15 8a5 5 0 0 1 0 8" }),
            f().createElement("path", { d: "M17.7 5a9 9 0 0 1 0 14" }),
            f().createElement("path", {
              d: "M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a0.8 .8 0 0 1 1.5 .5v14a0.8 .8 0 0 1 -1.5 .5l-3.5 -4.5",
            }),
          );
        }
        var ar = ["size", "color"];
        function as(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, ar);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-device-mobile",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("rect", {
              x: "6",
              y: "3",
              width: "12",
              height: "18",
              rx: "2",
            }),
            f().createElement("line", { x1: "11", y1: "4", x2: "13", y2: "4" }),
            f().createElement("line", {
              x1: "12",
              y1: "17",
              x2: "12",
              y2: "17.01",
            }),
          );
        }
        var at = ["size", "color"];
        function au(a) {
          var b = a.size,
            c = void 0 === b ? 24 : b,
            d = a.color,
            e = (0, E.$i)(a, at);
          return f().createElement(
            "svg",
            (0, E._P)(
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "icon icon-tabler icon-tabler-check",
                width: c,
                height: c,
                viewBox: "0 0 24 24",
                stroke: void 0 === d ? "currentColor" : d,
                strokeWidth: "2",
                fill: "none",
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              e,
            ),
            f().createElement("path", {
              stroke: "none",
              d: "M0 0h24v24H0z",
              fill: "none",
            }),
            f().createElement("path", { d: "M5 12l5 5l10 -10" }),
          );
        }
        let av = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080",
          aw = {
            "ai.business.type": "ECOMMERCE",
            "ai.greeting.new":
              "\xa1Hola! \uD83D\uDCA7 Bienvenido a *Antarqui Per\xfa*. Impulsa tu bienestar con la mejor hidrataci\xf3n:\n\n✅ *Agua Alcalina* (PH 8.2)\n✅ *Ionizada*\n✅ *Ozonizada*\n✅ *12 procesos de purificaci\xf3n*\n\n\uD83D\uDE9A \xa1*DELIVERY GRATIS* en Zonas de Cobertura! \uD83C\uDFE0\uD83D\uDCA8\n\n\uD83D\uDC49 *NUESTROS PRODUCTOS*:\n\uD83C\uDF81 \xbfTe gustar\xeda ver tambi\xe9n nuestra *PROMOCI\xd3N ESPECIAL* de 3 recargas con un precio incre\xedble?",
            "ai.greeting.registered":
              "\xa1Hola *[Nombre]*, bienvenido de nuevo a *Antarqui Per\xfa*! \uD83D\uDCA7 \xbfTe gustar\xeda pedir tu recarga de siempre o prefieres conocer nuestras promociones del d\xeda?",
            "ai.collect.location.text":
              "Por favor, comp\xe1rteme tu ubicaci\xf3n actual por el GPS nativo de WhatsApp \uD83D\uDCCD para coordinar tu env\xedo gratis a domicilio.",
            "ai.products.promotion.text":
              "\uD83C\uDF81 \xa1Tenemos excelentes noticias! Contamos con nuestra *Promoci\xf3n Especial del Mes*: 3 Recargas de Agua Alcalina de 20L por solo *S/ 39.00* (\xa1ahorras S/ 15.00!). Adem\xe1s, te podemos brindar informaci\xf3n de nuestros bidones nuevos de policarbonato. \xbfTe gustar\xeda llevar la promoci\xf3n o prefieres ver otros productos? \uD83D\uDCA7",
            "ai.collect.document.text":
              "Para procesar tu pedido, \xbfrequieres boleta de venta o factura? \uD83E\uDDFE Si es boleta facil\xedtame tu DNI (8 d\xedgitos) o tu RUC (11 d\xedgitos) con la raz\xf3n social si es factura.",
            "ai.ask.container.text":
              "Veo que llevas una recarga de agua de 20L. \uD83D\uDCA7 \xbfCuentas con envase retornable vac\xedo en casa para entregar al repartidor? Si no tienes, podemos cotizarte la venta de un envase nuevo.",
            "ai.payment.methods":
              "Yape, Plin, Efectivo contra entrega, Transferencias bancarias",
            "ai.custom.instructions":
              "Ofrecer la promoci\xf3n especial de 3 recargas si muestran inter\xe9s en compras familiares o de consumo recurrente.",
          };
        function ax() {
          let [a, b] = (0, e.useState)("general"),
            [c, l] = (0, e.useState)("welcome"),
            [m, n] = (0, e.useState)({
              "whatsapp.api.token": "",
              "whatsapp.phone.id": "",
              "whatsapp.verify.token": "",
              "whatsapp.display.number": "",
              "gemini.api.key": "",
              "gemini.model": "gemini-1.5-flash",
              "gemini.system.prompt": "",
              "ai.agent.name": "Asesor Comercial",
              "ai.business.description": "Venta de productos y servicios",
              "ai.tone": "Amigable y cercano",
              "ai.active": "false",
              "ai.max.quota": "30",
              "ai.business.type": "ECOMMERCE",
              "ai.ask.container": "true",
              "ai.ask.container.text":
                "Veo que llevas una recarga de agua de 20L. \uD83D\uDCA7 \xbfCuentas con envase retornable vac\xedo en casa para entregar al repartidor? Si no tienes, podemos cotizarte la venta de un envase nuevo.",
              "ai.collect.location": "true",
              "ai.collect.location.text":
                "Por favor, comp\xe1rteme tu ubicaci\xf3n actual por el GPS nativo de WhatsApp \uD83D\uDCCD para coordinar tu env\xedo gratis a domicilio.",
              "ai.products.promotion": "true",
              "ai.products.promotion.text":
                "\uD83C\uDF81 \xa1Tenemos excelentes noticias! Contamos con nuestra *Promoci\xf3n Especial del Mes*: 3 Recargas de Agua Alcalina de 20L por solo *S/ 39.00* (\xa1ahorras S/ 15.00!). Adem\xe1s, te podemos brindar informaci\xf3n de nuestros bidones nuevos de policarbonato. \xbfTe gustar\xeda llevar la promoci\xf3n o prefieres ver otros productos? \uD83D\uDCA7",
              "ai.products.promotion.media.ids": "",
              "ai.products.promotion.media.type": "NONE",
              "ai.collect.document": "true",
              "ai.collect.document.text":
                "Para procesar tu pedido, \xbfrequieres boleta de venta o factura? \uD83E\uDDFE Si es boleta facil\xedtame tu DNI (8 d\xedgitos) o tu RUC (11 d\xedgitos) con la raz\xf3n social si es factura.",
              "ai.greeting.new":
                "\xa1Hola! \uD83D\uDCA7 Bienvenido a *Antarqui Per\xfa*. Impulsa tu bienestar con la mejor hidrataci\xf3n:\n\n✅ *Agua Alcalina* (PH 8.2)\n✅ *Ionizada*\n✅ *Ozonizada*\n✅ *12 procesos de purificaci\xf3n*\n\n\uD83D\uDE9A \xa1*DELIVERY GRATIS* en Zonas de Cobertura! \uD83C\uDFE0\uD83D\uDCA8\n\n\uD83D\uDC49 *NUESTROS PRODUCTOS*:\n\uD83C\uDF81 \xbfTe gustar\xeda ver tambi\xe9n nuestra *PROMOCI\xd3N ESPECIAL* de 3 recargas con un precio incre\xedble?",
              "ai.greeting.registered":
                "\xa1Hola *[Nombre]*, bienvenido de nuevo a *Antarqui Per\xfa*! \uD83D\uDCA7 \xbfTe gustar\xeda pedir tu recarga de siempre o prefieres conocer nuestras promociones del d\xeda?",
              "ai.payment.methods":
                "Yape, Plin, Efectivo contra entrega, Transferencias bancarias",
              "ai.custom.instructions":
                "Ofrecer la promoci\xf3n especial de 3 recargas si muestran inter\xe9s en compras familiares o de consumo recurrente.",
              "ai.flow.order":
                "business,welcome,registered,location,promotion,billing,container,payment,custom",
            }),
            [o, p] = (0, e.useState)([
              "business",
              "welcome",
              "registered",
              "location",
              "promotion",
              "billing",
              "container",
              "payment",
              "custom",
            ]),
            q = (a, b) => {
              let c = [...o],
                d = "up" === b ? a - 1 : a + 1;
              if (d < 0 || d >= c.length) return;
              let e = c[a];
              ((c[a] = c[d]),
                (c[d] = e),
                p(c),
                n((a) => ({ ...a, "ai.flow.order": c.join(",") })));
            },
            [r, s] = (0, e.useState)([]),
            [t, u] = (0, e.useState)(null),
            [E, F] = (0, e.useState)(!1),
            [H, J] = (0, e.useState)(null),
            [L, N] = (0, e.useState)(!1),
            [P, R] = (0, e.useState)([]),
            [T, V] = (0, e.useState)({
              districtName: "",
              deliveryFee: 0,
              minOrderAmount: 0,
              isActive: !0,
              aliases: "",
            }),
            [X, Z] = (0, e.useState)(null),
            [_, ab] = (0, e.useState)(!1),
            [ad, af] = (0, e.useState)([]),
            [ah, aj] = (0, e.useState)({
              category: "",
              keywords: "",
              answer: "",
              attachmentUrl: "",
              attachmentType: "NONE",
              intent: "",
              active: !0,
              priority: 100,
              mediaIdWhatsapp: "",
              mediaCaption: "",
            }),
            [al, an] = (0, e.useState)(null),
            [ap, ar] = (0, e.useState)(!1),
            [at, ax] = (0, e.useState)(!0),
            [ay, az] = (0, e.useState)(!1),
            [aA, aB] = (0, e.useState)({
              show: !1,
              type: "success",
              message: "",
            }),
            [aC, aD] = (0, e.useState)(!1),
            [aE, aF] = (0, e.useState)(!1),
            aG = (a, b) => {
              (aB({ show: !0, type: a, message: b }),
                setTimeout(() => {
                  aB((a) => ({ ...a, show: !1 }));
                }, 5e3));
            },
            aH = (a) => {
              if (!a) return "";
              let b = a
                .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
                .replace(/_(.*?)_/g, "<em>$1</em>")
                .replace(/~(.*?)~/g, "<del>$1</del>")
                .replace(/\n/g, "<br/>");
              return (0, d.jsx)("span", {
                dangerouslySetInnerHTML: { __html: b },
              });
            },
            aI = (a) => {
              let { name: b, value: c } = a.target;
              n((a) => ({ ...a, [b]: c }));
            },
            aJ = async (a) => {
              (a && a.preventDefault(), az(!0));
              try {
                (
                  await fetch(`${av}/api/settings`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(m),
                  })
                ).ok
                  ? aG(
                      "success",
                      "Configuraciones generales guardadas exitosamente.",
                    )
                  : aG(
                      "danger",
                      "Error en el servidor al intentar guardar configuraciones.",
                    );
              } catch (a) {
                (console.error(a),
                  aG("danger", "Error de red al intentar guardar."));
              } finally {
                az(!1);
              }
            },
            aK = async (a, b) => {
              let c = !b,
                d = { ...r[a], aiEnabled: c };
              try {
                if (
                  (
                    await fetch(`${av}/api/ai/products-config`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        productoId: d.productoId,
                        aiEnabled: d.aiEnabled,
                        searchKeywords: d.searchKeywords || "",
                        customAiDescription: d.customAiDescription || "",
                        intent: d.intent || "",
                        priority: d.priority ? parseInt(d.priority) : 100,
                        mediaIdWhatsapp: d.mediaIdWhatsapp || "",
                        imageCaption: d.imageCaption || "",
                      }),
                    })
                  ).ok
                ) {
                  let b = [...r];
                  ((b[a].aiEnabled = c),
                    s(b),
                    aG(
                      "success",
                      `Producto ${c ? "activado" : "desactivado"} para la IA.`,
                    ));
                }
              } catch (a) {
                (console.error(a),
                  aG("danger", "Error al cambiar estado del producto."));
              }
            },
            aL = async (a) => {
              (a.preventDefault(), az(!0));
              try {
                (
                  await fetch(`${av}/api/ai/products-config`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      productoId: t.productoId,
                      aiEnabled: t.aiEnabled,
                      searchKeywords: t.searchKeywords || "",
                      customAiDescription: t.customAiDescription || "",
                      intent: t.intent || "",
                      priority: t.priority ? parseInt(t.priority) : 100,
                      mediaIdWhatsapp: t.mediaIdWhatsapp || "",
                      imageCaption: t.imageCaption || "",
                    }),
                  })
                ).ok
                  ? (s((a) =>
                      a.map((a) =>
                        a.productoId === t.productoId ? { ...a, ...t } : a,
                      ),
                    ),
                    F(!1),
                    aG(
                      "success",
                      "Configuraci\xf3n de IA para el producto guardada correctamente.",
                    ))
                  : aG(
                      "danger",
                      "Error al guardar configuraci\xf3n en el servidor.",
                    );
              } catch (a) {
                (console.error(a),
                  aG("danger", "Error de red al actualizar producto."));
              } finally {
                az(!1);
              }
            },
            aM = async (a) => {
              a.preventDefault();
              let b = X || T;
              try {
                if (
                  (
                    await fetch(`${av}/api/ai/shipping-coverage`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(b),
                    })
                  ).ok
                ) {
                  let a = await fetch(`${av}/api/ai/shipping-coverage`);
                  (a.ok && R(await a.json()),
                    ab(!1),
                    V({
                      districtName: "",
                      deliveryFee: 0,
                      minOrderAmount: 0,
                      isActive: !0,
                      aliases: "",
                    }),
                    Z(null),
                    aG(
                      "success",
                      X
                        ? "Zona de despacho actualizada correctamente."
                        : "Zona de despacho agregada correctamente.",
                    ));
                }
              } catch (a) {
                (console.error(a),
                  aG("danger", "Error al guardar zona de cobertura."));
              }
            },
            aN = async (a) => {
              if (
                confirm(
                  "\xbfEst\xe1s seguro de eliminar esta zona de cobertura?",
                )
              )
                try {
                  (
                    await fetch(`${av}/api/ai/shipping-coverage/${a}`, {
                      method: "DELETE",
                    })
                  ).ok &&
                    (R((b) => b.filter((b) => b.id !== a)),
                    aG("success", "Zona de cobertura eliminada."));
                } catch (a) {
                  (console.error(a),
                    aG("danger", "Error al intentar eliminar."));
                }
            },
            aO = async (a) => {
              a.preventDefault();
              let b = al || ah;
              try {
                if (
                  (
                    await fetch(`${av}/api/ai/knowledge-base`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(b),
                    })
                  ).ok
                ) {
                  let a = await fetch(`${av}/api/ai/knowledge-base`);
                  (a.ok && af(await a.json()),
                    ar(!1),
                    aj({
                      category: "",
                      keywords: "",
                      answer: "",
                      attachmentUrl: "",
                      attachmentType: "NONE",
                      intent: "",
                      active: !0,
                      priority: 100,
                      mediaIdWhatsapp: "",
                      mediaCaption: "",
                    }),
                    an(null),
                    aG(
                      "success",
                      al
                        ? "Pregunta frecuente actualizada correctamente."
                        : "Pregunta frecuente agregada exitosamente.",
                    ));
                }
              } catch (a) {
                (console.error(a), aG("danger", "Error al guardar FAQ."));
              }
            },
            aP = async (a) => {
              if (
                confirm(
                  "\xbfEst\xe1s seguro de eliminar esta pregunta frecuente?",
                )
              )
                try {
                  (
                    await fetch(`${av}/api/ai/knowledge-base/${a}`, {
                      method: "DELETE",
                    })
                  ).ok &&
                    (af((b) => b.filter((b) => b.id !== a)),
                    aG("success", "Pregunta frecuente eliminada."));
                } catch (a) {
                  (console.error(a),
                    aG("danger", "Error al intentar eliminar."));
                }
            };
          return at
            ? (0, d.jsx)(g.A, {
                className: "d-flex justify-content-center align-items-center",
                style: { minHeight: "60vh" },
                children: (0, d.jsxs)("div", {
                  className: "text-center",
                  children: [
                    (0, d.jsx)(h.A, {
                      animation: "border",
                      variant: "success",
                      className: "mb-2",
                    }),
                    (0, d.jsx)("p", {
                      className: "text-muted",
                      children: "Cargando configuraciones...",
                    }),
                  ],
                }),
              })
            : (0, d.jsxs)(g.A, {
                fluid: "xxl",
                className: "pt-7",
                children: [
                  (0, d.jsx)(i.A, {
                    className: "mb-4",
                    children: (0, d.jsx)(j.A, {
                      children: (0, d.jsx)("div", {
                        className: "hk-pg-header",
                        children: (0, d.jsx)("div", {
                          className:
                            "d-flex justify-content-between align-items-center",
                          children: (0, d.jsxs)("div", {
                            children: [
                              (0, d.jsx)("h1", {
                                className: "pg-title font-weight-bold",
                                style: { letterSpacing: "-0.02em" },
                                children:
                                  "\uD83E\uDD16 Configuraci\xf3n del Agente de IA",
                              }),
                              (0, d.jsx)("p", {
                                className: "text-muted",
                                children:
                                  "Personaliza la identidad, el cat\xe1logo de venta, la cobertura de reparto y las respuestas frecuentes del agente de WhatsApp.",
                              }),
                            ],
                          }),
                        }),
                      }),
                    }),
                  }),
                  aA.show &&
                    (0, d.jsx)(i.A, {
                      className: "mb-3",
                      children: (0, d.jsx)(j.A, {
                        children: (0, d.jsx)(k.A, {
                          variant: aA.type,
                          onClose: () => aB({ ...aA, show: !1 }),
                          dismissible: !0,
                          children: aA.message,
                        }),
                      }),
                    }),
                  (0, d.jsxs)(v, {
                    activeKey: a,
                    onSelect: (a) => b(a),
                    className: "mb-4 hk-tabs",
                    variant: "pills",
                    children: [
                      (0, d.jsx)(w.A, {
                        eventKey: "general",
                        title: (0, d.jsxs)("span", {
                          children: [
                            (0, d.jsx)(G, { size: 18, className: "me-1" }),
                            " General",
                          ],
                        }),
                        children: (0, d.jsxs)(x.A, {
                          onSubmit: aJ,
                          children: [
                            (0, d.jsx)(i.A, {
                              className: "g-4",
                              children: (0, d.jsx)(j.A, {
                                xs: 12,
                                children: (0, d.jsxs)(y.A, {
                                  className: "shadow-sm border-0",
                                  style: { borderRadius: "12px" },
                                  children: [
                                    (0, d.jsxs)(y.A.Header, {
                                      className:
                                        "bg-primary-subtle text-primary-emphasis border-0 py-3 d-flex align-items-center gap-2",
                                      style: { borderRadius: "12px 12px 0 0" },
                                      children: [
                                        (0, d.jsx)(I, { size: 24 }),
                                        (0, d.jsx)("h5", {
                                          className: "mb-0 fw-bold",
                                          children:
                                            "Identidad del Agente de IA",
                                        }),
                                      ],
                                    }),
                                    (0, d.jsxs)(y.A.Body, {
                                      className: "p-4",
                                      children: [
                                        (0, d.jsxs)(x.A.Group, {
                                          className:
                                            "mb-4 d-flex align-items-center justify-content-between p-3 bg-light rounded",
                                          controlId: "aiActive",
                                          children: [
                                            (0, d.jsxs)("div", {
                                              children: [
                                                (0, d.jsx)(x.A.Label, {
                                                  className:
                                                    "fw-bold mb-0 d-block",
                                                  children:
                                                    "\uD83D\uDFE2 Agente de IA Activo",
                                                }),
                                                (0, d.jsx)(x.A.Text, {
                                                  className: "text-muted small",
                                                  children:
                                                    "Enciende o apaga las respuestas autom\xe1ticas globales por WhatsApp.",
                                                }),
                                              ],
                                            }),
                                            (0, d.jsx)(x.A.Check, {
                                              type: "switch",
                                              id: "ai-active-switch",
                                              checked:
                                                "true" === m["ai.active"],
                                              onChange: (a) =>
                                                n((b) => ({
                                                  ...b,
                                                  "ai.active": a.target.checked
                                                    ? "true"
                                                    : "false",
                                                })),
                                              style: {
                                                fontSize: "1.5rem",
                                                cursor: "pointer",
                                              },
                                            }),
                                          ],
                                        }),
                                        (0, d.jsxs)(x.A.Group, {
                                          className: "mb-3",
                                          controlId: "aiAgentName",
                                          children: [
                                            (0, d.jsx)(x.A.Label, {
                                              className: "fw-semibold small",
                                              children: "Nombre del Agente",
                                            }),
                                            (0, d.jsx)(x.A.Control, {
                                              type: "text",
                                              name: "ai.agent.name",
                                              value: m["ai.agent.name"],
                                              onChange: aI,
                                              placeholder: "Ej. Antarqui Bot",
                                              className: "form-control-lg",
                                              style: { fontSize: "0.9rem" },
                                            }),
                                          ],
                                        }),
                                        (0, d.jsxs)(x.A.Group, {
                                          className: "mb-3",
                                          controlId: "aiBusinessDesc",
                                          children: [
                                            (0, d.jsx)(x.A.Label, {
                                              className: "fw-semibold small",
                                              children:
                                                "Giro / Descripci\xf3n del Negocio",
                                            }),
                                            (0, d.jsx)(x.A.Control, {
                                              as: "textarea",
                                              rows: 3,
                                              name: "ai.business.description",
                                              value:
                                                m["ai.business.description"],
                                              onChange: aI,
                                              placeholder:
                                                "Ej. Empresa peruana distribuidora de agua alcalina ionizada pH 8.2 con delivery gratis...",
                                              style: { fontSize: "0.9rem" },
                                            }),
                                          ],
                                        }),
                                        (0, d.jsxs)(x.A.Group, {
                                          className: "mb-3",
                                          controlId: "aiTone",
                                          children: [
                                            (0, d.jsx)(x.A.Label, {
                                              className: "fw-semibold small",
                                              children:
                                                "Tono de Comunicaci\xf3n",
                                            }),
                                            (0, d.jsxs)(x.A.Select, {
                                              name: "ai.tone",
                                              value: m["ai.tone"],
                                              onChange: aI,
                                              className: "form-control-lg",
                                              style: { fontSize: "0.9rem" },
                                              children: [
                                                (0, d.jsx)("option", {
                                                  value: "Amigable y cercano",
                                                  children:
                                                    "Amigable y cercano",
                                                }),
                                                (0, d.jsx)("option", {
                                                  value: "Profesional y formal",
                                                  children:
                                                    "Profesional y formal",
                                                }),
                                                (0, d.jsx)("option", {
                                                  value: "Directo y conciso",
                                                  children: "Directo y conciso",
                                                }),
                                                (0, d.jsx)("option", {
                                                  value: "Entusiasta y alegre",
                                                  children:
                                                    "Entusiasta y alegre",
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        (0, d.jsxs)(x.A.Group, {
                                          className: "mb-3",
                                          controlId: "aiMaxQuota",
                                          children: [
                                            (0, d.jsx)(x.A.Label, {
                                              className: "fw-semibold small",
                                              children:
                                                "L\xedmite diario de respuestas autom\xe1ticas (por cliente)",
                                            }),
                                            (0, d.jsx)(x.A.Control, {
                                              type: "number",
                                              name: "ai.max.quota",
                                              value: m["ai.max.quota"] || "30",
                                              onChange: aI,
                                              placeholder: "Ej. 30",
                                              min: "1",
                                              max: "500",
                                              className: "form-control-lg",
                                              style: { fontSize: "0.9rem" },
                                            }),
                                            (0, d.jsx)(x.A.Text, {
                                              className: "text-muted small",
                                              children:
                                                "Desactiva el chatbot para un contacto si supera esta cantidad de respuestas del bot en 24h para evitar bucles de spam.",
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              }),
                            }),
                            (0, d.jsx)(i.A, {
                              className: "mt-4 g-4",
                              children: (0, d.jsx)(j.A, {
                                xs: 12,
                                children: (0, d.jsxs)(y.A, {
                                  className: "shadow-sm border-0",
                                  style: { borderRadius: "12px" },
                                  children: [
                                    (0, d.jsx)(y.A.Header, {
                                      className:
                                        "bg-light border-0 py-3 fw-bold",
                                      children:
                                        "⚙️ Credenciales Meta WhatsApp API",
                                    }),
                                    (0, d.jsxs)(y.A.Body, {
                                      className: "p-4",
                                      children: [
                                        (0, d.jsxs)(i.A, {
                                          className:
                                            "row-cols-1 row-cols-md-2 g-3",
                                          children: [
                                            (0, d.jsx)(j.A, {
                                              children: (0, d.jsxs)(x.A.Group, {
                                                className: "mb-3",
                                                controlId: "wspPhoneId",
                                                children: [
                                                  (0, d.jsx)(x.A.Label, {
                                                    className:
                                                      "fw-semibold small",
                                                    children: "Phone Number ID",
                                                  }),
                                                  (0, d.jsx)(x.A.Control, {
                                                    type: "text",
                                                    name: "whatsapp.phone.id",
                                                    value:
                                                      m["whatsapp.phone.id"],
                                                    onChange: aI,
                                                    placeholder:
                                                      "Ej. 987682517769596",
                                                    style: {
                                                      fontSize: "0.9rem",
                                                    },
                                                  }),
                                                ],
                                              }),
                                            }),
                                            (0, d.jsx)(j.A, {
                                              children: (0, d.jsxs)(x.A.Group, {
                                                className: "mb-3",
                                                controlId: "wspDisplayNum",
                                                children: [
                                                  (0, d.jsx)(x.A.Label, {
                                                    className:
                                                      "fw-semibold small",
                                                    children:
                                                      "WhatsApp Business Number",
                                                  }),
                                                  (0, d.jsx)(x.A.Control, {
                                                    type: "text",
                                                    name: "whatsapp.display.number",
                                                    value:
                                                      m[
                                                        "whatsapp.display.number"
                                                      ],
                                                    onChange: aI,
                                                    placeholder:
                                                      "Ej. +51 987654321",
                                                    style: {
                                                      fontSize: "0.9rem",
                                                    },
                                                  }),
                                                ],
                                              }),
                                            }),
                                          ],
                                        }),
                                        (0, d.jsxs)(i.A, {
                                          className:
                                            "row-cols-1 row-cols-md-2 g-3",
                                          children: [
                                            (0, d.jsx)(j.A, {
                                              children: (0, d.jsxs)(x.A.Group, {
                                                className: "mb-3",
                                                controlId: "wspVerifyToken",
                                                children: [
                                                  (0, d.jsx)(x.A.Label, {
                                                    className:
                                                      "fw-semibold small",
                                                    children:
                                                      "Webhook Verification Token",
                                                  }),
                                                  (0, d.jsx)(x.A.Control, {
                                                    type: "text",
                                                    name: "whatsapp.verify.token",
                                                    value:
                                                      m[
                                                        "whatsapp.verify.token"
                                                      ],
                                                    onChange: aI,
                                                    placeholder:
                                                      "Ej. mi_token_secreto_wsp",
                                                    style: {
                                                      fontSize: "0.9rem",
                                                    },
                                                  }),
                                                ],
                                              }),
                                            }),
                                            (0, d.jsx)(j.A, {
                                              children: (0, d.jsxs)(x.A.Group, {
                                                className: "mb-3",
                                                controlId: "wspApiToken",
                                                children: [
                                                  (0, d.jsx)(x.A.Label, {
                                                    className:
                                                      "fw-semibold small",
                                                    children:
                                                      "Permanent Access Token",
                                                  }),
                                                  (0, d.jsxs)(z.A, {
                                                    children: [
                                                      (0, d.jsx)(x.A.Control, {
                                                        type: aC
                                                          ? "text"
                                                          : "password",
                                                        name: "whatsapp.api.token",
                                                        value:
                                                          m[
                                                            "whatsapp.api.token"
                                                          ],
                                                        onChange: aI,
                                                        placeholder: "EAAQ6...",
                                                        style: {
                                                          fontSize: "0.85rem",
                                                        },
                                                      }),
                                                      (0, d.jsx)(A.A, {
                                                        variant:
                                                          "outline-secondary",
                                                        onClick: () => aD(!aC),
                                                        children: aC
                                                          ? (0, d.jsx)(K, {
                                                              size: 18,
                                                            })
                                                          : (0, d.jsx)(M, {
                                                              size: 18,
                                                            }),
                                                      }),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              }),
                            }),
                            (0, d.jsx)("div", {
                              className: "d-flex justify-content-end mt-4",
                              children: (0, d.jsxs)(A.A, {
                                variant: "success",
                                type: "submit",
                                size: "lg",
                                disabled: ay,
                                style: { borderRadius: "8px" },
                                children: [
                                  ay
                                    ? (0, d.jsx)(h.A, {
                                        size: "sm",
                                        className: "me-2",
                                      })
                                    : (0, d.jsx)(O, {
                                        size: 18,
                                        className: "me-2",
                                      }),
                                  "Guardar Configuraci\xf3n General",
                                ],
                              }),
                            }),
                          ],
                        }),
                      }),
                      (0, d.jsx)(w.A, {
                        eventKey: "ai_config",
                        title: (0, d.jsxs)("span", {
                          children: [
                            (0, d.jsx)(Q, { size: 18, className: "me-1" }),
                            " Configuraci\xf3n de IA",
                          ],
                        }),
                        children: (0, d.jsxs)(x.A, {
                          onSubmit: aJ,
                          children: [
                            (0, d.jsx)(i.A, {
                              className: "g-4",
                              children: (0, d.jsx)(j.A, {
                                xs: 12,
                                children: (0, d.jsxs)(y.A, {
                                  className: "shadow-sm border-0",
                                  style: { borderRadius: "12px" },
                                  children: [
                                    (0, d.jsxs)(y.A.Header, {
                                      className:
                                        "bg-success-subtle text-success-emphasis border-0 py-3 d-flex align-items-center gap-2",
                                      style: { borderRadius: "12px 12px 0 0" },
                                      children: [
                                        (0, d.jsx)(Q, { size: 24 }),
                                        (0, d.jsx)("h5", {
                                          className: "mb-0 fw-bold",
                                          children: "Google Gemini AI & Reglas",
                                        }),
                                      ],
                                    }),
                                    (0, d.jsxs)(y.A.Body, {
                                      className: "p-4",
                                      children: [
                                        (0, d.jsxs)(x.A.Group, {
                                          className: "mb-3",
                                          controlId: "geminiKey",
                                          children: [
                                            (0, d.jsx)(x.A.Label, {
                                              className: "fw-semibold small",
                                              children: "Google Gemini API Key",
                                            }),
                                            (0, d.jsxs)(z.A, {
                                              children: [
                                                (0, d.jsx)(x.A.Control, {
                                                  type: aE
                                                    ? "text"
                                                    : "password",
                                                  name: "gemini.api.key",
                                                  value: m["gemini.api.key"],
                                                  onChange: aI,
                                                  placeholder: "AIzaSy...",
                                                  className: "form-control-lg",
                                                  style: { fontSize: "0.9rem" },
                                                }),
                                                (0, d.jsx)(A.A, {
                                                  variant: "outline-secondary",
                                                  onClick: () => aF(!aE),
                                                  style: {
                                                    borderTopRightRadius: "8px",
                                                    borderBottomRightRadius:
                                                      "8px",
                                                  },
                                                  children: aE
                                                    ? (0, d.jsx)(K, {
                                                        size: 18,
                                                      })
                                                    : (0, d.jsx)(M, {
                                                        size: 18,
                                                      }),
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        (0, d.jsxs)(x.A.Group, {
                                          className: "mb-3",
                                          controlId: "geminiModel",
                                          children: [
                                            (0, d.jsx)(x.A.Label, {
                                              className: "fw-semibold small",
                                              children: "Modelo de Gemini",
                                            }),
                                            (0, d.jsxs)(x.A.Select, {
                                              name: "gemini.model_select",
                                              value: [
                                                "gemini-1.5-flash",
                                                "gemini-2.5-flash",
                                                "gemini-1.5-pro",
                                              ].includes(m["gemini.model"])
                                                ? m["gemini.model"]
                                                : "custom",
                                              onChange: (a) => {
                                                let b = a.target.value;
                                                "custom" !== b
                                                  ? n((a) => ({
                                                      ...a,
                                                      "gemini.model": b,
                                                    }))
                                                  : n((a) => ({
                                                      ...a,
                                                      "gemini.model": "",
                                                    }));
                                              },
                                              className: "form-control-lg mb-2",
                                              style: { fontSize: "0.9rem" },
                                              children: [
                                                (0, d.jsx)("option", {
                                                  value: "gemini-1.5-flash",
                                                  children:
                                                    "Gemini 1.5 Flash (Recomendado - R\xe1pido y econ\xf3mico)",
                                                }),
                                                (0, d.jsx)("option", {
                                                  value: "gemini-2.5-flash",
                                                  children:
                                                    "Gemini 2.5 Flash (\xdaltima generaci\xf3n - Balanceado)",
                                                }),
                                                (0, d.jsx)("option", {
                                                  value: "gemini-1.5-pro",
                                                  children:
                                                    "Gemini 1.5 Pro (Complejo - Alta capacidad)",
                                                }),
                                                (0, d.jsx)("option", {
                                                  value: "custom",
                                                  children:
                                                    "Otro modelo (Personalizado)...",
                                                }),
                                              ],
                                            }),
                                            ![
                                              "gemini-1.5-flash",
                                              "gemini-2.5-flash",
                                              "gemini-1.5-pro",
                                            ].includes(m["gemini.model"]) &&
                                              (0, d.jsx)(x.A.Control, {
                                                type: "text",
                                                name: "gemini.model",
                                                value: m["gemini.model"] || "",
                                                onChange: aI,
                                                placeholder:
                                                  "Ingrese el nombre exacto del modelo (ej: gemini-2.5-pro)",
                                                style: { fontSize: "0.9rem" },
                                                className: "mb-1",
                                              }),
                                            (0, d.jsxs)(x.A.Text, {
                                              className: "text-muted small",
                                              children: [
                                                "Modelo activo configurado: ",
                                                (0, d.jsx)("strong", {
                                                  className: "text-success",
                                                  children:
                                                    m["gemini.model"] ||
                                                    "gemini-1.5-flash (por defecto)",
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        (0, d.jsx)("hr", {
                                          className: "my-4 text-muted",
                                        }),
                                        (0, d.jsxs)("div", {
                                          className:
                                            "bg-light p-4 rounded mb-3 border",
                                          children: [
                                            (0, d.jsxs)("h6", {
                                              className:
                                                "fw-bold mb-1 d-flex align-items-center gap-2 text-dark",
                                              style: {
                                                letterSpacing: "-0.01em",
                                              },
                                              children: [
                                                (0, d.jsx)(S, {
                                                  size: 18,
                                                  className: "text-success",
                                                }),
                                                "Constructor Visual de Flujo Conversacional (Flow Builder)",
                                              ],
                                            }),
                                            (0, d.jsx)("p", {
                                              className:
                                                "text-muted small mb-4",
                                              children:
                                                "Crea conversaciones por bloques modulares conectados. Haz clic en cualquier nodo para editar su contenido y ver su simulaci\xf3n en tiempo real.",
                                            }),
                                            (0, d.jsxs)(i.A, {
                                              className: "g-4",
                                              children: [
                                                (0, d.jsx)(j.A, {
                                                  lg: 6,
                                                  children: (0, d.jsx)("div", {
                                                    className:
                                                      "d-flex flex-column gap-2 p-3 rounded border",
                                                    style: {
                                                      backgroundColor:
                                                        "#f8f9fa",
                                                      maxHeight: "720px",
                                                      overflowY: "auto",
                                                    },
                                                    children: o.map((a, b) => {
                                                      let e = null;
                                                      return (
                                                        "business" === a
                                                          ? (e = (0, d.jsxs)(
                                                              "div",
                                                              {
                                                                className: `p-3 rounded border shadow-sm position-relative cursor-pointer transition-all ${"business" === c ? "border-success bg-success-subtle shadow-md fw-semibold" : "bg-white"}`,
                                                                onClick: () =>
                                                                  l("business"),
                                                                style: {
                                                                  cursor:
                                                                    "pointer",
                                                                  transition:
                                                                    "all 0.2s ease",
                                                                  borderLeftWidth:
                                                                    "business" ===
                                                                    c
                                                                      ? "4px"
                                                                      : "1px",
                                                                },
                                                                children: [
                                                                  (0, d.jsxs)(
                                                                    "div",
                                                                    {
                                                                      className:
                                                                        "d-flex align-items-center justify-content-between",
                                                                      children:
                                                                        [
                                                                          (0,
                                                                          d.jsxs)(
                                                                            "span",
                                                                            {
                                                                              className:
                                                                                "text-dark",
                                                                              children:
                                                                                [
                                                                                  (0,
                                                                                  d.jsx)(
                                                                                    G,
                                                                                    {
                                                                                      size: 16,
                                                                                      className:
                                                                                        "me-2 text-primary",
                                                                                    },
                                                                                  ),
                                                                                  " Giro o Tipo de Negocio",
                                                                                ],
                                                                            },
                                                                          ),
                                                                          (0,
                                                                          d.jsxs)(
                                                                            "div",
                                                                            {
                                                                              className:
                                                                                "d-flex align-items-center gap-2",
                                                                              children:
                                                                                [
                                                                                  (0,
                                                                                  d.jsx)(
                                                                                    "span",
                                                                                    {
                                                                                      className:
                                                                                        "badge bg-primary text-white border-0",
                                                                                      style:
                                                                                        {
                                                                                          fontSize:
                                                                                            "0.65rem",
                                                                                        },
                                                                                      children:
                                                                                        "Inicio del Flujo",
                                                                                    },
                                                                                  ),
                                                                                  (0,
                                                                                  d.jsxs)(
                                                                                    "div",
                                                                                    {
                                                                                      className:
                                                                                        "d-flex align-items-center gap-1 bg-light px-1 py-0.5 rounded border",
                                                                                      children:
                                                                                        [
                                                                                          (0,
                                                                                          d.jsx)(
                                                                                            A.A,
                                                                                            {
                                                                                              variant:
                                                                                                "link",
                                                                                              size: "sm",
                                                                                              className:
                                                                                                "p-0 text-muted lh-1",
                                                                                              disabled:
                                                                                                0 ===
                                                                                                b,
                                                                                              onClick:
                                                                                                (
                                                                                                  a,
                                                                                                ) => {
                                                                                                  (a.stopPropagation(),
                                                                                                    q(
                                                                                                      b,
                                                                                                      "up",
                                                                                                    ));
                                                                                                },
                                                                                              title:
                                                                                                "Subir paso",
                                                                                              style:
                                                                                                {
                                                                                                  fontSize:
                                                                                                    "0.68rem",
                                                                                                  textDecoration:
                                                                                                    "none",
                                                                                                },
                                                                                              children:
                                                                                                "▲",
                                                                                            },
                                                                                          ),
                                                                                          (0,
                                                                                          d.jsx)(
                                                                                            A.A,
                                                                                            {
                                                                                              variant:
                                                                                                "link",
                                                                                              size: "sm",
                                                                                              className:
                                                                                                "p-0 text-muted lh-1",
                                                                                              disabled:
                                                                                                b ===
                                                                                                o.length -
                                                                                                  1,
                                                                                              onClick:
                                                                                                (
                                                                                                  a,
                                                                                                ) => {
                                                                                                  (a.stopPropagation(),
                                                                                                    q(
                                                                                                      b,
                                                                                                      "down",
                                                                                                    ));
                                                                                                },
                                                                                              title:
                                                                                                "Bajar paso",
                                                                                              style:
                                                                                                {
                                                                                                  fontSize:
                                                                                                    "0.68rem",
                                                                                                  textDecoration:
                                                                                                    "none",
                                                                                                },
                                                                                              children:
                                                                                                "▼",
                                                                                            },
                                                                                          ),
                                                                                        ],
                                                                                    },
                                                                                  ),
                                                                                ],
                                                                            },
                                                                          ),
                                                                        ],
                                                                    },
                                                                  ),
                                                                  (0, d.jsx)(
                                                                    "div",
                                                                    {
                                                                      className:
                                                                        "text-muted small mt-2 text-truncate",
                                                                      style: {
                                                                        fontSize:
                                                                          "0.78rem",
                                                                      },
                                                                      children:
                                                                        "ECOMMERCE" ===
                                                                        m[
                                                                          "ai.business.type"
                                                                        ]
                                                                          ? "\uD83D\uDED2 E-commerce (Venta de Productos)"
                                                                          : m[
                                                                              "ai.business.type"
                                                                            ],
                                                                    },
                                                                  ),
                                                                ],
                                                              },
                                                            ))
                                                          : "welcome" === a
                                                            ? (e = (0, d.jsxs)(
                                                                "div",
                                                                {
                                                                  className: `p-3 rounded border shadow-sm position-relative cursor-pointer transition-all ${"welcome" === c ? "border-success bg-success-subtle shadow-md fw-semibold" : "bg-white"}`,
                                                                  onClick: () =>
                                                                    l(
                                                                      "welcome",
                                                                    ),
                                                                  style: {
                                                                    cursor:
                                                                      "pointer",
                                                                    transition:
                                                                      "all 0.2s ease",
                                                                    borderLeftWidth:
                                                                      "welcome" ===
                                                                      c
                                                                        ? "4px"
                                                                        : "1px",
                                                                  },
                                                                  children: [
                                                                    (0, d.jsxs)(
                                                                      "div",
                                                                      {
                                                                        className:
                                                                          "d-flex align-items-center justify-content-between",
                                                                        children:
                                                                          [
                                                                            (0,
                                                                            d.jsxs)(
                                                                              "span",
                                                                              {
                                                                                className:
                                                                                  "text-dark",
                                                                                children:
                                                                                  [
                                                                                    (0,
                                                                                    d.jsx)(
                                                                                      U,
                                                                                      {
                                                                                        size: 16,
                                                                                        className:
                                                                                          "me-2 text-success",
                                                                                      },
                                                                                    ),
                                                                                    " Saludo (Cliente Nuevo)",
                                                                                  ],
                                                                              },
                                                                            ),
                                                                            (0,
                                                                            d.jsxs)(
                                                                              "div",
                                                                              {
                                                                                className:
                                                                                  "d-flex align-items-center gap-2",
                                                                                children:
                                                                                  [
                                                                                    (0,
                                                                                    d.jsx)(
                                                                                      "span",
                                                                                      {
                                                                                        className:
                                                                                          "badge bg-success-subtle text-success border-0",
                                                                                        style:
                                                                                          {
                                                                                            fontSize:
                                                                                              "0.65rem",
                                                                                          },
                                                                                        children:
                                                                                          "Activo",
                                                                                      },
                                                                                    ),
                                                                                    (0,
                                                                                    d.jsxs)(
                                                                                      "div",
                                                                                      {
                                                                                        className:
                                                                                          "d-flex align-items-center gap-1 bg-light px-1 py-0.5 rounded border",
                                                                                        children:
                                                                                          [
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              A.A,
                                                                                              {
                                                                                                variant:
                                                                                                  "link",
                                                                                                size: "sm",
                                                                                                className:
                                                                                                  "p-0 text-muted lh-1",
                                                                                                disabled:
                                                                                                  0 ===
                                                                                                  b,
                                                                                                onClick:
                                                                                                  (
                                                                                                    a,
                                                                                                  ) => {
                                                                                                    (a.stopPropagation(),
                                                                                                      q(
                                                                                                        b,
                                                                                                        "up",
                                                                                                      ));
                                                                                                  },
                                                                                                title:
                                                                                                  "Subir paso",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.68rem",
                                                                                                    textDecoration:
                                                                                                      "none",
                                                                                                  },
                                                                                                children:
                                                                                                  "▲",
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              A.A,
                                                                                              {
                                                                                                variant:
                                                                                                  "link",
                                                                                                size: "sm",
                                                                                                className:
                                                                                                  "p-0 text-muted lh-1",
                                                                                                disabled:
                                                                                                  b ===
                                                                                                  o.length -
                                                                                                    1,
                                                                                                onClick:
                                                                                                  (
                                                                                                    a,
                                                                                                  ) => {
                                                                                                    (a.stopPropagation(),
                                                                                                      q(
                                                                                                        b,
                                                                                                        "down",
                                                                                                      ));
                                                                                                  },
                                                                                                title:
                                                                                                  "Bajar paso",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.68rem",
                                                                                                    textDecoration:
                                                                                                      "none",
                                                                                                  },
                                                                                                children:
                                                                                                  "▼",
                                                                                              },
                                                                                            ),
                                                                                          ],
                                                                                      },
                                                                                    ),
                                                                                  ],
                                                                              },
                                                                            ),
                                                                          ],
                                                                      },
                                                                    ),
                                                                    (0, d.jsx)(
                                                                      "div",
                                                                      {
                                                                        className:
                                                                          "text-muted small mt-2 text-truncate",
                                                                        style: {
                                                                          fontSize:
                                                                            "0.78rem",
                                                                        },
                                                                        children:
                                                                          m[
                                                                            "ai.greeting.new"
                                                                          ],
                                                                      },
                                                                    ),
                                                                  ],
                                                                },
                                                              ))
                                                            : "registered" === a
                                                              ? (e = (0,
                                                                d.jsxs)("div", {
                                                                  className: `p-3 rounded border shadow-sm position-relative cursor-pointer transition-all ${"registered" === c ? "border-success bg-success-subtle shadow-md fw-semibold" : "bg-white"}`,
                                                                  onClick: () =>
                                                                    l(
                                                                      "registered",
                                                                    ),
                                                                  style: {
                                                                    cursor:
                                                                      "pointer",
                                                                    transition:
                                                                      "all 0.2s ease",
                                                                    borderLeftWidth:
                                                                      "registered" ===
                                                                      c
                                                                        ? "4px"
                                                                        : "1px",
                                                                  },
                                                                  children: [
                                                                    (0, d.jsxs)(
                                                                      "div",
                                                                      {
                                                                        className:
                                                                          "d-flex align-items-center justify-content-between",
                                                                        children:
                                                                          [
                                                                            (0,
                                                                            d.jsxs)(
                                                                              "span",
                                                                              {
                                                                                className:
                                                                                  "text-dark",
                                                                                children:
                                                                                  [
                                                                                    (0,
                                                                                    d.jsx)(
                                                                                      W,
                                                                                      {
                                                                                        size: 16,
                                                                                        className:
                                                                                          "me-2 text-success",
                                                                                      },
                                                                                    ),
                                                                                    " Saludo (Cliente Registrado)",
                                                                                  ],
                                                                              },
                                                                            ),
                                                                            (0,
                                                                            d.jsxs)(
                                                                              "div",
                                                                              {
                                                                                className:
                                                                                  "d-flex align-items-center gap-2",
                                                                                children:
                                                                                  [
                                                                                    (0,
                                                                                    d.jsx)(
                                                                                      "span",
                                                                                      {
                                                                                        className:
                                                                                          "badge bg-success-subtle text-success border-0",
                                                                                        style:
                                                                                          {
                                                                                            fontSize:
                                                                                              "0.65rem",
                                                                                          },
                                                                                        children:
                                                                                          "Activo",
                                                                                      },
                                                                                    ),
                                                                                    (0,
                                                                                    d.jsxs)(
                                                                                      "div",
                                                                                      {
                                                                                        className:
                                                                                          "d-flex align-items-center gap-1 bg-light px-1 py-0.5 rounded border",
                                                                                        children:
                                                                                          [
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              A.A,
                                                                                              {
                                                                                                variant:
                                                                                                  "link",
                                                                                                size: "sm",
                                                                                                className:
                                                                                                  "p-0 text-muted lh-1",
                                                                                                disabled:
                                                                                                  0 ===
                                                                                                  b,
                                                                                                onClick:
                                                                                                  (
                                                                                                    a,
                                                                                                  ) => {
                                                                                                    (a.stopPropagation(),
                                                                                                      q(
                                                                                                        b,
                                                                                                        "up",
                                                                                                      ));
                                                                                                  },
                                                                                                title:
                                                                                                  "Subir paso",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.68rem",
                                                                                                    textDecoration:
                                                                                                      "none",
                                                                                                  },
                                                                                                children:
                                                                                                  "▲",
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              A.A,
                                                                                              {
                                                                                                variant:
                                                                                                  "link",
                                                                                                size: "sm",
                                                                                                className:
                                                                                                  "p-0 text-muted lh-1",
                                                                                                disabled:
                                                                                                  b ===
                                                                                                  o.length -
                                                                                                    1,
                                                                                                onClick:
                                                                                                  (
                                                                                                    a,
                                                                                                  ) => {
                                                                                                    (a.stopPropagation(),
                                                                                                      q(
                                                                                                        b,
                                                                                                        "down",
                                                                                                      ));
                                                                                                  },
                                                                                                title:
                                                                                                  "Bajar paso",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.68rem",
                                                                                                    textDecoration:
                                                                                                      "none",
                                                                                                  },
                                                                                                children:
                                                                                                  "▼",
                                                                                              },
                                                                                            ),
                                                                                          ],
                                                                                      },
                                                                                    ),
                                                                                  ],
                                                                              },
                                                                            ),
                                                                          ],
                                                                      },
                                                                    ),
                                                                    (0, d.jsx)(
                                                                      "div",
                                                                      {
                                                                        className:
                                                                          "text-muted small mt-2 text-truncate",
                                                                        style: {
                                                                          fontSize:
                                                                            "0.78rem",
                                                                        },
                                                                        children:
                                                                          m[
                                                                            "ai.greeting.registered"
                                                                          ],
                                                                      },
                                                                    ),
                                                                  ],
                                                                }))
                                                              : "location" === a
                                                                ? (e = (0,
                                                                  d.jsxs)(
                                                                    "div",
                                                                    {
                                                                      className: `p-3 rounded border shadow-sm position-relative cursor-pointer transition-all ${"location" === c ? "border-success bg-success-subtle shadow-md fw-semibold" : "bg-white"} ${"false" === m["ai.collect.location"] ? "opacity-50" : ""}`,
                                                                      onClick:
                                                                        () =>
                                                                          l(
                                                                            "location",
                                                                          ),
                                                                      style: {
                                                                        cursor:
                                                                          "pointer",
                                                                        transition:
                                                                          "all 0.2s ease",
                                                                        borderLeftWidth:
                                                                          "location" ===
                                                                          c
                                                                            ? "4px"
                                                                            : "1px",
                                                                      },
                                                                      children:
                                                                        [
                                                                          (0,
                                                                          d.jsxs)(
                                                                            "div",
                                                                            {
                                                                              className:
                                                                                "d-flex align-items-center justify-content-between",
                                                                              children:
                                                                                [
                                                                                  (0,
                                                                                  d.jsxs)(
                                                                                    "span",
                                                                                    {
                                                                                      className:
                                                                                        "text-dark",
                                                                                      children:
                                                                                        [
                                                                                          (0,
                                                                                          d.jsx)(
                                                                                            Y,
                                                                                            {
                                                                                              size: 16,
                                                                                              className:
                                                                                                "me-2 text-info",
                                                                                            },
                                                                                          ),
                                                                                          " Solicitar Ubicaci\xf3n GPS",
                                                                                        ],
                                                                                    },
                                                                                  ),
                                                                                  (0,
                                                                                  d.jsxs)(
                                                                                    "div",
                                                                                    {
                                                                                      className:
                                                                                        "d-flex align-items-center gap-2",
                                                                                      children:
                                                                                        [
                                                                                          (0,
                                                                                          d.jsx)(
                                                                                            "span",
                                                                                            {
                                                                                              className: `badge ${"true" === m["ai.collect.location"] ? "bg-info text-white" : "bg-secondary text-white"}`,
                                                                                              style:
                                                                                                {
                                                                                                  fontSize:
                                                                                                    "0.65rem",
                                                                                                },
                                                                                              children:
                                                                                                "true" ===
                                                                                                m[
                                                                                                  "ai.collect.location"
                                                                                                ]
                                                                                                  ? "Encendido"
                                                                                                  : "Apagado",
                                                                                            },
                                                                                          ),
                                                                                          (0,
                                                                                          d.jsxs)(
                                                                                            "div",
                                                                                            {
                                                                                              className:
                                                                                                "d-flex align-items-center gap-1 bg-light px-1 py-0.5 rounded border",
                                                                                              children:
                                                                                                [
                                                                                                  (0,
                                                                                                  d.jsx)(
                                                                                                    A.A,
                                                                                                    {
                                                                                                      variant:
                                                                                                        "link",
                                                                                                      size: "sm",
                                                                                                      className:
                                                                                                        "p-0 text-muted lh-1",
                                                                                                      disabled:
                                                                                                        0 ===
                                                                                                        b,
                                                                                                      onClick:
                                                                                                        (
                                                                                                          a,
                                                                                                        ) => {
                                                                                                          (a.stopPropagation(),
                                                                                                            q(
                                                                                                              b,
                                                                                                              "up",
                                                                                                            ));
                                                                                                        },
                                                                                                      title:
                                                                                                        "Subir paso",
                                                                                                      style:
                                                                                                        {
                                                                                                          fontSize:
                                                                                                            "0.68rem",
                                                                                                          textDecoration:
                                                                                                            "none",
                                                                                                        },
                                                                                                      children:
                                                                                                        "▲",
                                                                                                    },
                                                                                                  ),
                                                                                                  (0,
                                                                                                  d.jsx)(
                                                                                                    A.A,
                                                                                                    {
                                                                                                      variant:
                                                                                                        "link",
                                                                                                      size: "sm",
                                                                                                      className:
                                                                                                        "p-0 text-muted lh-1",
                                                                                                      disabled:
                                                                                                        b ===
                                                                                                        o.length -
                                                                                                          1,
                                                                                                      onClick:
                                                                                                        (
                                                                                                          a,
                                                                                                        ) => {
                                                                                                          (a.stopPropagation(),
                                                                                                            q(
                                                                                                              b,
                                                                                                              "down",
                                                                                                            ));
                                                                                                        },
                                                                                                      title:
                                                                                                        "Bajar paso",
                                                                                                      style:
                                                                                                        {
                                                                                                          fontSize:
                                                                                                            "0.68rem",
                                                                                                          textDecoration:
                                                                                                            "none",
                                                                                                        },
                                                                                                      children:
                                                                                                        "▼",
                                                                                                    },
                                                                                                  ),
                                                                                                ],
                                                                                            },
                                                                                          ),
                                                                                        ],
                                                                                    },
                                                                                  ),
                                                                                ],
                                                                            },
                                                                          ),
                                                                          (0,
                                                                          d.jsx)(
                                                                            "div",
                                                                            {
                                                                              className:
                                                                                "text-muted small mt-2 text-truncate",
                                                                              style:
                                                                                {
                                                                                  fontSize:
                                                                                    "0.78rem",
                                                                                },
                                                                              children:
                                                                                "true" ===
                                                                                m[
                                                                                  "ai.collect.location"
                                                                                ]
                                                                                  ? m[
                                                                                      "ai.collect.location.text"
                                                                                    ]
                                                                                  : "Saltar este nodo en la conversaci\xf3n.",
                                                                            },
                                                                          ),
                                                                        ],
                                                                    },
                                                                  ))
                                                                : "promotion" ===
                                                                    a
                                                                  ? (e = (0,
                                                                    d.jsxs)(
                                                                      "div",
                                                                      {
                                                                        className: `p-3 rounded border shadow-sm position-relative cursor-pointer transition-all ${"promotion" === c ? "border-success bg-success-subtle shadow-md fw-semibold" : "bg-white"} ${"false" === m["ai.products.promotion"] ? "opacity-50" : ""}`,
                                                                        onClick:
                                                                          () =>
                                                                            l(
                                                                              "promotion",
                                                                            ),
                                                                        style: {
                                                                          cursor:
                                                                            "pointer",
                                                                          transition:
                                                                            "all 0.2s ease",
                                                                          borderLeftWidth:
                                                                            "promotion" ===
                                                                            c
                                                                              ? "4px"
                                                                              : "1px",
                                                                        },
                                                                        children:
                                                                          [
                                                                            (0,
                                                                            d.jsxs)(
                                                                              "div",
                                                                              {
                                                                                className:
                                                                                  "d-flex align-items-center justify-content-between",
                                                                                children:
                                                                                  [
                                                                                    (0,
                                                                                    d.jsxs)(
                                                                                      "span",
                                                                                      {
                                                                                        className:
                                                                                          "text-dark",
                                                                                        children:
                                                                                          [
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              $,
                                                                                              {
                                                                                                size: 16,
                                                                                                className:
                                                                                                  "me-2 text-warning",
                                                                                              },
                                                                                            ),
                                                                                            " Enviar Promociones / Productos",
                                                                                          ],
                                                                                      },
                                                                                    ),
                                                                                    (0,
                                                                                    d.jsxs)(
                                                                                      "div",
                                                                                      {
                                                                                        className:
                                                                                          "d-flex align-items-center gap-2",
                                                                                        children:
                                                                                          [
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "span",
                                                                                              {
                                                                                                className: `badge ${"true" === m["ai.products.promotion"] ? "bg-warning text-dark" : "bg-secondary text-white"}`,
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.65rem",
                                                                                                  },
                                                                                                children:
                                                                                                  "true" ===
                                                                                                  m[
                                                                                                    "ai.products.promotion"
                                                                                                  ]
                                                                                                    ? "Encendido"
                                                                                                    : "Apagado",
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsxs)(
                                                                                              "div",
                                                                                              {
                                                                                                className:
                                                                                                  "d-flex align-items-center gap-1 bg-light px-1 py-0.5 rounded border",
                                                                                                children:
                                                                                                  [
                                                                                                    (0,
                                                                                                    d.jsx)(
                                                                                                      A.A,
                                                                                                      {
                                                                                                        variant:
                                                                                                          "link",
                                                                                                        size: "sm",
                                                                                                        className:
                                                                                                          "p-0 text-muted lh-1",
                                                                                                        disabled:
                                                                                                          0 ===
                                                                                                          b,
                                                                                                        onClick:
                                                                                                          (
                                                                                                            a,
                                                                                                          ) => {
                                                                                                            (a.stopPropagation(),
                                                                                                              q(
                                                                                                                b,
                                                                                                                "up",
                                                                                                              ));
                                                                                                          },
                                                                                                        title:
                                                                                                          "Subir paso",
                                                                                                        style:
                                                                                                          {
                                                                                                            fontSize:
                                                                                                              "0.68rem",
                                                                                                            textDecoration:
                                                                                                              "none",
                                                                                                          },
                                                                                                        children:
                                                                                                          "▲",
                                                                                                      },
                                                                                                    ),
                                                                                                    (0,
                                                                                                    d.jsx)(
                                                                                                      A.A,
                                                                                                      {
                                                                                                        variant:
                                                                                                          "link",
                                                                                                        size: "sm",
                                                                                                        className:
                                                                                                          "p-0 text-muted lh-1",
                                                                                                        disabled:
                                                                                                          b ===
                                                                                                          o.length -
                                                                                                            1,
                                                                                                        onClick:
                                                                                                          (
                                                                                                            a,
                                                                                                          ) => {
                                                                                                            (a.stopPropagation(),
                                                                                                              q(
                                                                                                                b,
                                                                                                                "down",
                                                                                                              ));
                                                                                                          },
                                                                                                        title:
                                                                                                          "Bajar paso",
                                                                                                        style:
                                                                                                          {
                                                                                                            fontSize:
                                                                                                              "0.68rem",
                                                                                                            textDecoration:
                                                                                                              "none",
                                                                                                          },
                                                                                                        children:
                                                                                                          "▼",
                                                                                                      },
                                                                                                    ),
                                                                                                  ],
                                                                                              },
                                                                                            ),
                                                                                          ],
                                                                                      },
                                                                                    ),
                                                                                  ],
                                                                              },
                                                                            ),
                                                                            (0,
                                                                            d.jsx)(
                                                                              "div",
                                                                              {
                                                                                className:
                                                                                  "text-muted small mt-2 text-truncate",
                                                                                style:
                                                                                  {
                                                                                    fontSize:
                                                                                      "0.78rem",
                                                                                  },
                                                                                children:
                                                                                  "true" ===
                                                                                  m[
                                                                                    "ai.products.promotion"
                                                                                  ]
                                                                                    ? m[
                                                                                        "ai.products.promotion.text"
                                                                                      ]
                                                                                    : "Saltar el env\xedo de promociones.",
                                                                              },
                                                                            ),
                                                                          ],
                                                                      },
                                                                    ))
                                                                  : "billing" ===
                                                                      a
                                                                    ? (e = (0,
                                                                      d.jsxs)(
                                                                        "div",
                                                                        {
                                                                          className: `p-3 rounded border shadow-sm position-relative cursor-pointer transition-all ${"billing" === c ? "border-success bg-success-subtle shadow-md fw-semibold" : "bg-white"} ${"false" === m["ai.collect.document"] ? "opacity-50" : ""}`,
                                                                          onClick:
                                                                            () =>
                                                                              l(
                                                                                "billing",
                                                                              ),
                                                                          style:
                                                                            {
                                                                              cursor:
                                                                                "pointer",
                                                                              transition:
                                                                                "all 0.2s ease",
                                                                              borderLeftWidth:
                                                                                "billing" ===
                                                                                c
                                                                                  ? "4px"
                                                                                  : "1px",
                                                                            },
                                                                          children:
                                                                            [
                                                                              (0,
                                                                              d.jsxs)(
                                                                                "div",
                                                                                {
                                                                                  className:
                                                                                    "d-flex align-items-center justify-content-between",
                                                                                  children:
                                                                                    [
                                                                                      (0,
                                                                                      d.jsxs)(
                                                                                        "span",
                                                                                        {
                                                                                          className:
                                                                                            "text-dark",
                                                                                          children:
                                                                                            [
                                                                                              (0,
                                                                                              d.jsx)(
                                                                                                aa,
                                                                                                {
                                                                                                  size: 16,
                                                                                                  className:
                                                                                                    "me-2 text-info",
                                                                                                },
                                                                                              ),
                                                                                              " Solicitar Datos Facturaci\xf3n",
                                                                                            ],
                                                                                        },
                                                                                      ),
                                                                                      (0,
                                                                                      d.jsxs)(
                                                                                        "div",
                                                                                        {
                                                                                          className:
                                                                                            "d-flex align-items-center gap-2",
                                                                                          children:
                                                                                            [
                                                                                              (0,
                                                                                              d.jsx)(
                                                                                                "span",
                                                                                                {
                                                                                                  className: `badge ${"true" === m["ai.collect.document"] ? "bg-info text-white" : "bg-secondary text-white"}`,
                                                                                                  style:
                                                                                                    {
                                                                                                      fontSize:
                                                                                                        "0.65rem",
                                                                                                    },
                                                                                                  children:
                                                                                                    "true" ===
                                                                                                    m[
                                                                                                      "ai.collect.document"
                                                                                                    ]
                                                                                                      ? "Encendido"
                                                                                                      : "Apagado",
                                                                                                },
                                                                                              ),
                                                                                              (0,
                                                                                              d.jsxs)(
                                                                                                "div",
                                                                                                {
                                                                                                  className:
                                                                                                    "d-flex align-items-center gap-1 bg-light px-1 py-0.5 rounded border",
                                                                                                  children:
                                                                                                    [
                                                                                                      (0,
                                                                                                      d.jsx)(
                                                                                                        A.A,
                                                                                                        {
                                                                                                          variant:
                                                                                                            "link",
                                                                                                          size: "sm",
                                                                                                          className:
                                                                                                            "p-0 text-muted lh-1",
                                                                                                          disabled:
                                                                                                            0 ===
                                                                                                            b,
                                                                                                          onClick:
                                                                                                            (
                                                                                                              a,
                                                                                                            ) => {
                                                                                                              (a.stopPropagation(),
                                                                                                                q(
                                                                                                                  b,
                                                                                                                  "up",
                                                                                                                ));
                                                                                                            },
                                                                                                          title:
                                                                                                            "Subir paso",
                                                                                                          style:
                                                                                                            {
                                                                                                              fontSize:
                                                                                                                "0.68rem",
                                                                                                              textDecoration:
                                                                                                                "none",
                                                                                                            },
                                                                                                          children:
                                                                                                            "▲",
                                                                                                        },
                                                                                                      ),
                                                                                                      (0,
                                                                                                      d.jsx)(
                                                                                                        A.A,
                                                                                                        {
                                                                                                          variant:
                                                                                                            "link",
                                                                                                          size: "sm",
                                                                                                          className:
                                                                                                            "p-0 text-muted lh-1",
                                                                                                          disabled:
                                                                                                            b ===
                                                                                                            o.length -
                                                                                                              1,
                                                                                                          onClick:
                                                                                                            (
                                                                                                              a,
                                                                                                            ) => {
                                                                                                              (a.stopPropagation(),
                                                                                                                q(
                                                                                                                  b,
                                                                                                                  "down",
                                                                                                                ));
                                                                                                            },
                                                                                                          title:
                                                                                                            "Bajar paso",
                                                                                                          style:
                                                                                                            {
                                                                                                              fontSize:
                                                                                                                "0.68rem",
                                                                                                              textDecoration:
                                                                                                                "none",
                                                                                                            },
                                                                                                          children:
                                                                                                            "▼",
                                                                                                        },
                                                                                                      ),
                                                                                                    ],
                                                                                                },
                                                                                              ),
                                                                                            ],
                                                                                        },
                                                                                      ),
                                                                                    ],
                                                                                },
                                                                              ),
                                                                              (0,
                                                                              d.jsx)(
                                                                                "div",
                                                                                {
                                                                                  className:
                                                                                    "text-muted small mt-2 text-truncate",
                                                                                  style:
                                                                                    {
                                                                                      fontSize:
                                                                                        "0.78rem",
                                                                                    },
                                                                                  children:
                                                                                    "true" ===
                                                                                    m[
                                                                                      "ai.collect.document"
                                                                                    ]
                                                                                      ? m[
                                                                                          "ai.collect.document.text"
                                                                                        ]
                                                                                      : "Saltar este nodo en la conversaci\xf3n.",
                                                                                },
                                                                              ),
                                                                            ],
                                                                        },
                                                                      ))
                                                                    : "container" ===
                                                                        a
                                                                      ? (e = (0,
                                                                        d.jsxs)(
                                                                          "div",
                                                                          {
                                                                            className: `p-3 rounded border shadow-sm position-relative cursor-pointer transition-all ${"container" === c ? "border-success bg-success-subtle shadow-md fw-semibold" : "bg-white"} ${"false" === m["ai.ask.container"] ? "opacity-50" : ""}`,
                                                                            onClick:
                                                                              () =>
                                                                                l(
                                                                                  "container",
                                                                                ),
                                                                            style:
                                                                              {
                                                                                cursor:
                                                                                  "pointer",
                                                                                transition:
                                                                                  "all 0.2s ease",
                                                                                borderLeftWidth:
                                                                                  "container" ===
                                                                                  c
                                                                                    ? "4px"
                                                                                    : "1px",
                                                                              },
                                                                            children:
                                                                              [
                                                                                (0,
                                                                                d.jsxs)(
                                                                                  "div",
                                                                                  {
                                                                                    className:
                                                                                      "d-flex align-items-center justify-content-between",
                                                                                    children:
                                                                                      [
                                                                                        (0,
                                                                                        d.jsxs)(
                                                                                          "span",
                                                                                          {
                                                                                            className:
                                                                                              "text-dark",
                                                                                            children:
                                                                                              [
                                                                                                (0,
                                                                                                d.jsx)(
                                                                                                  ac,
                                                                                                  {
                                                                                                    size: 16,
                                                                                                    className:
                                                                                                      "me-2 text-info",
                                                                                                  },
                                                                                                ),
                                                                                                " Preguntar por Envase (20L)",
                                                                                              ],
                                                                                          },
                                                                                        ),
                                                                                        (0,
                                                                                        d.jsxs)(
                                                                                          "div",
                                                                                          {
                                                                                            className:
                                                                                              "d-flex align-items-center gap-2",
                                                                                            children:
                                                                                              [
                                                                                                (0,
                                                                                                d.jsx)(
                                                                                                  "span",
                                                                                                  {
                                                                                                    className: `badge ${"true" === m["ai.ask.container"] ? "bg-info text-white" : "bg-secondary text-white"}`,
                                                                                                    style:
                                                                                                      {
                                                                                                        fontSize:
                                                                                                          "0.65rem",
                                                                                                      },
                                                                                                    children:
                                                                                                      "true" ===
                                                                                                      m[
                                                                                                        "ai.ask.container"
                                                                                                      ]
                                                                                                        ? "Encendido"
                                                                                                        : "Apagado",
                                                                                                  },
                                                                                                ),
                                                                                                (0,
                                                                                                d.jsxs)(
                                                                                                  "div",
                                                                                                  {
                                                                                                    className:
                                                                                                      "d-flex align-items-center gap-1 bg-light px-1 py-0.5 rounded border",
                                                                                                    children:
                                                                                                      [
                                                                                                        (0,
                                                                                                        d.jsx)(
                                                                                                          A.A,
                                                                                                          {
                                                                                                            variant:
                                                                                                              "link",
                                                                                                            size: "sm",
                                                                                                            className:
                                                                                                              "p-0 text-muted lh-1",
                                                                                                            disabled:
                                                                                                              0 ===
                                                                                                              b,
                                                                                                            onClick:
                                                                                                              (
                                                                                                                a,
                                                                                                              ) => {
                                                                                                                (a.stopPropagation(),
                                                                                                                  q(
                                                                                                                    b,
                                                                                                                    "up",
                                                                                                                  ));
                                                                                                              },
                                                                                                            title:
                                                                                                              "Subir paso",
                                                                                                            style:
                                                                                                              {
                                                                                                                fontSize:
                                                                                                                  "0.68rem",
                                                                                                                textDecoration:
                                                                                                                  "none",
                                                                                                              },
                                                                                                            children:
                                                                                                              "▲",
                                                                                                          },
                                                                                                        ),
                                                                                                        (0,
                                                                                                        d.jsx)(
                                                                                                          A.A,
                                                                                                          {
                                                                                                            variant:
                                                                                                              "link",
                                                                                                            size: "sm",
                                                                                                            className:
                                                                                                              "p-0 text-muted lh-1",
                                                                                                            disabled:
                                                                                                              b ===
                                                                                                              o.length -
                                                                                                                1,
                                                                                                            onClick:
                                                                                                              (
                                                                                                                a,
                                                                                                              ) => {
                                                                                                                (a.stopPropagation(),
                                                                                                                  q(
                                                                                                                    b,
                                                                                                                    "down",
                                                                                                                  ));
                                                                                                              },
                                                                                                            title:
                                                                                                              "Bajar paso",
                                                                                                            style:
                                                                                                              {
                                                                                                                fontSize:
                                                                                                                  "0.68rem",
                                                                                                                textDecoration:
                                                                                                                  "none",
                                                                                                              },
                                                                                                            children:
                                                                                                              "▼",
                                                                                                          },
                                                                                                        ),
                                                                                                      ],
                                                                                                  },
                                                                                                ),
                                                                                              ],
                                                                                          },
                                                                                        ),
                                                                                      ],
                                                                                  },
                                                                                ),
                                                                                (0,
                                                                                d.jsx)(
                                                                                  "div",
                                                                                  {
                                                                                    className:
                                                                                      "text-muted small mt-2 text-truncate",
                                                                                    style:
                                                                                      {
                                                                                        fontSize:
                                                                                          "0.78rem",
                                                                                      },
                                                                                    children:
                                                                                      "true" ===
                                                                                      m[
                                                                                        "ai.ask.container"
                                                                                      ]
                                                                                        ? m[
                                                                                            "ai.ask.container.text"
                                                                                          ]
                                                                                        : "Saltar este nodo en la conversaci\xf3n.",
                                                                                  },
                                                                                ),
                                                                              ],
                                                                          },
                                                                        ))
                                                                      : "payment" ===
                                                                          a
                                                                        ? (e =
                                                                            (0,
                                                                            d.jsxs)(
                                                                              "div",
                                                                              {
                                                                                className: `p-3 rounded border shadow-sm position-relative cursor-pointer transition-all ${"payment" === c ? "border-success bg-success-subtle shadow-md fw-semibold" : "bg-white"}`,
                                                                                onClick:
                                                                                  () =>
                                                                                    l(
                                                                                      "payment",
                                                                                    ),
                                                                                style:
                                                                                  {
                                                                                    cursor:
                                                                                      "pointer",
                                                                                    transition:
                                                                                      "all 0.2s ease",
                                                                                    borderLeftWidth:
                                                                                      "payment" ===
                                                                                      c
                                                                                        ? "4px"
                                                                                        : "1px",
                                                                                  },
                                                                                children:
                                                                                  [
                                                                                    (0,
                                                                                    d.jsxs)(
                                                                                      "div",
                                                                                      {
                                                                                        className:
                                                                                          "d-flex align-items-center justify-content-between",
                                                                                        children:
                                                                                          [
                                                                                            (0,
                                                                                            d.jsxs)(
                                                                                              "span",
                                                                                              {
                                                                                                className:
                                                                                                  "text-dark",
                                                                                                children:
                                                                                                  [
                                                                                                    (0,
                                                                                                    d.jsx)(
                                                                                                      ae,
                                                                                                      {
                                                                                                        size: 16,
                                                                                                        className:
                                                                                                          "me-2 text-warning",
                                                                                                      },
                                                                                                    ),
                                                                                                    " M\xe9todos de Pago Aceptados",
                                                                                                  ],
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsxs)(
                                                                                              "div",
                                                                                              {
                                                                                                className:
                                                                                                  "d-flex align-items-center gap-2",
                                                                                                children:
                                                                                                  [
                                                                                                    (0,
                                                                                                    d.jsx)(
                                                                                                      "span",
                                                                                                      {
                                                                                                        className:
                                                                                                          "badge bg-warning text-dark border-0",
                                                                                                        style:
                                                                                                          {
                                                                                                            fontSize:
                                                                                                              "0.65rem",
                                                                                                          },
                                                                                                        children:
                                                                                                          "Activo",
                                                                                                      },
                                                                                                    ),
                                                                                                    (0,
                                                                                                    d.jsxs)(
                                                                                                      "div",
                                                                                                      {
                                                                                                        className:
                                                                                                          "d-flex align-items-center gap-1 bg-light px-1 py-0.5 rounded border",
                                                                                                        children:
                                                                                                          [
                                                                                                            (0,
                                                                                                            d.jsx)(
                                                                                                              A.A,
                                                                                                              {
                                                                                                                variant:
                                                                                                                  "link",
                                                                                                                size: "sm",
                                                                                                                className:
                                                                                                                  "p-0 text-muted lh-1",
                                                                                                                disabled:
                                                                                                                  0 ===
                                                                                                                  b,
                                                                                                                onClick:
                                                                                                                  (
                                                                                                                    a,
                                                                                                                  ) => {
                                                                                                                    (a.stopPropagation(),
                                                                                                                      q(
                                                                                                                        b,
                                                                                                                        "up",
                                                                                                                      ));
                                                                                                                  },
                                                                                                                title:
                                                                                                                  "Subir paso",
                                                                                                                style:
                                                                                                                  {
                                                                                                                    fontSize:
                                                                                                                      "0.68rem",
                                                                                                                    textDecoration:
                                                                                                                      "none",
                                                                                                                  },
                                                                                                                children:
                                                                                                                  "▲",
                                                                                                              },
                                                                                                            ),
                                                                                                            (0,
                                                                                                            d.jsx)(
                                                                                                              A.A,
                                                                                                              {
                                                                                                                variant:
                                                                                                                  "link",
                                                                                                                size: "sm",
                                                                                                                className:
                                                                                                                  "p-0 text-muted lh-1",
                                                                                                                disabled:
                                                                                                                  b ===
                                                                                                                  o.length -
                                                                                                                    1,
                                                                                                                onClick:
                                                                                                                  (
                                                                                                                    a,
                                                                                                                  ) => {
                                                                                                                    (a.stopPropagation(),
                                                                                                                      q(
                                                                                                                        b,
                                                                                                                        "down",
                                                                                                                      ));
                                                                                                                  },
                                                                                                                title:
                                                                                                                  "Bajar paso",
                                                                                                                style:
                                                                                                                  {
                                                                                                                    fontSize:
                                                                                                                      "0.68rem",
                                                                                                                    textDecoration:
                                                                                                                      "none",
                                                                                                                  },
                                                                                                                children:
                                                                                                                  "▼",
                                                                                                              },
                                                                                                            ),
                                                                                                          ],
                                                                                                      },
                                                                                                    ),
                                                                                                  ],
                                                                                              },
                                                                                            ),
                                                                                          ],
                                                                                      },
                                                                                    ),
                                                                                    (0,
                                                                                    d.jsx)(
                                                                                      "div",
                                                                                      {
                                                                                        className:
                                                                                          "text-muted small mt-2 text-truncate",
                                                                                        style:
                                                                                          {
                                                                                            fontSize:
                                                                                              "0.78rem",
                                                                                          },
                                                                                        children:
                                                                                          m[
                                                                                            "ai.payment.methods"
                                                                                          ],
                                                                                      },
                                                                                    ),
                                                                                  ],
                                                                              },
                                                                            ))
                                                                        : "custom" ===
                                                                            a &&
                                                                          (e =
                                                                            (0,
                                                                            d.jsxs)(
                                                                              "div",
                                                                              {
                                                                                className: `p-3 rounded border shadow-sm position-relative cursor-pointer transition-all ${"custom" === c ? "border-success bg-success-subtle shadow-md fw-semibold" : "bg-white"}`,
                                                                                onClick:
                                                                                  () =>
                                                                                    l(
                                                                                      "custom",
                                                                                    ),
                                                                                style:
                                                                                  {
                                                                                    cursor:
                                                                                      "pointer",
                                                                                    transition:
                                                                                      "all 0.2s ease",
                                                                                    borderLeftWidth:
                                                                                      "custom" ===
                                                                                      c
                                                                                        ? "4px"
                                                                                        : "1px",
                                                                                  },
                                                                                children:
                                                                                  [
                                                                                    (0,
                                                                                    d.jsxs)(
                                                                                      "div",
                                                                                      {
                                                                                        className:
                                                                                          "d-flex align-items-center justify-content-between",
                                                                                        children:
                                                                                          [
                                                                                            (0,
                                                                                            d.jsxs)(
                                                                                              "span",
                                                                                              {
                                                                                                className:
                                                                                                  "text-dark",
                                                                                                children:
                                                                                                  [
                                                                                                    (0,
                                                                                                    d.jsx)(
                                                                                                      S,
                                                                                                      {
                                                                                                        size: 16,
                                                                                                        className:
                                                                                                          "me-2 text-secondary",
                                                                                                      },
                                                                                                    ),
                                                                                                    " Instrucciones Adicionales",
                                                                                                  ],
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsxs)(
                                                                                              "div",
                                                                                              {
                                                                                                className:
                                                                                                  "d-flex align-items-center gap-2",
                                                                                                children:
                                                                                                  [
                                                                                                    (0,
                                                                                                    d.jsx)(
                                                                                                      "span",
                                                                                                      {
                                                                                                        className:
                                                                                                          "badge bg-secondary text-white border-0",
                                                                                                        style:
                                                                                                          {
                                                                                                            fontSize:
                                                                                                              "0.65rem",
                                                                                                          },
                                                                                                        children:
                                                                                                          "Opcional",
                                                                                                      },
                                                                                                    ),
                                                                                                    (0,
                                                                                                    d.jsxs)(
                                                                                                      "div",
                                                                                                      {
                                                                                                        className:
                                                                                                          "d-flex align-items-center gap-1 bg-light px-1 py-0.5 rounded border",
                                                                                                        children:
                                                                                                          [
                                                                                                            (0,
                                                                                                            d.jsx)(
                                                                                                              A.A,
                                                                                                              {
                                                                                                                variant:
                                                                                                                  "link",
                                                                                                                size: "sm",
                                                                                                                className:
                                                                                                                  "p-0 text-muted lh-1",
                                                                                                                disabled:
                                                                                                                  0 ===
                                                                                                                  b,
                                                                                                                onClick:
                                                                                                                  (
                                                                                                                    a,
                                                                                                                  ) => {
                                                                                                                    (a.stopPropagation(),
                                                                                                                      q(
                                                                                                                        b,
                                                                                                                        "up",
                                                                                                                      ));
                                                                                                                  },
                                                                                                                title:
                                                                                                                  "Subir paso",
                                                                                                                style:
                                                                                                                  {
                                                                                                                    fontSize:
                                                                                                                      "0.68rem",
                                                                                                                    textDecoration:
                                                                                                                      "none",
                                                                                                                  },
                                                                                                                children:
                                                                                                                  "▲",
                                                                                                              },
                                                                                                            ),
                                                                                                            (0,
                                                                                                            d.jsx)(
                                                                                                              A.A,
                                                                                                              {
                                                                                                                variant:
                                                                                                                  "link",
                                                                                                                size: "sm",
                                                                                                                className:
                                                                                                                  "p-0 text-muted lh-1",
                                                                                                                disabled:
                                                                                                                  b ===
                                                                                                                  o.length -
                                                                                                                    1,
                                                                                                                onClick:
                                                                                                                  (
                                                                                                                    a,
                                                                                                                  ) => {
                                                                                                                    (a.stopPropagation(),
                                                                                                                      q(
                                                                                                                        b,
                                                                                                                        "down",
                                                                                                                      ));
                                                                                                                  },
                                                                                                                title:
                                                                                                                  "Bajar paso",
                                                                                                                style:
                                                                                                                  {
                                                                                                                    fontSize:
                                                                                                                      "0.68rem",
                                                                                                                    textDecoration:
                                                                                                                      "none",
                                                                                                                  },
                                                                                                                children:
                                                                                                                  "▼",
                                                                                                              },
                                                                                                            ),
                                                                                                          ],
                                                                                                      },
                                                                                                    ),
                                                                                                  ],
                                                                                              },
                                                                                            ),
                                                                                          ],
                                                                                      },
                                                                                    ),
                                                                                    (0,
                                                                                    d.jsx)(
                                                                                      "div",
                                                                                      {
                                                                                        className:
                                                                                          "text-muted small mt-2 text-truncate",
                                                                                        style:
                                                                                          {
                                                                                            fontSize:
                                                                                              "0.78rem",
                                                                                          },
                                                                                        children:
                                                                                          m[
                                                                                            "ai.custom.instructions"
                                                                                          ] ||
                                                                                          "Sin reglas adicionales escritas.",
                                                                                      },
                                                                                    ),
                                                                                  ],
                                                                              },
                                                                            )),
                                                        (0, d.jsxs)(
                                                          f().Fragment,
                                                          {
                                                            children: [
                                                              e,
                                                              b <
                                                                o.length - 1 &&
                                                                (0, d.jsx)(
                                                                  "div",
                                                                  {
                                                                    className:
                                                                      "d-flex justify-content-center align-items-center my-1",
                                                                    children:
                                                                      (0,
                                                                      d.jsx)(
                                                                        "svg",
                                                                        {
                                                                          width:
                                                                            "24",
                                                                          height:
                                                                            "24",
                                                                          viewBox:
                                                                            "0 0 24 24",
                                                                          fill: "none",
                                                                          stroke:
                                                                            "currentColor",
                                                                          strokeWidth:
                                                                            "2",
                                                                          className:
                                                                            "text-muted",
                                                                          children:
                                                                            (0,
                                                                            d.jsx)(
                                                                              "path",
                                                                              {
                                                                                d: "M12 5v14M19 12l-7 7-7-7",
                                                                              },
                                                                            ),
                                                                        },
                                                                      ),
                                                                  },
                                                                ),
                                                            ],
                                                          },
                                                          a,
                                                        )
                                                      );
                                                    }),
                                                  }),
                                                }),
                                                (0, d.jsx)(j.A, {
                                                  lg: 6,
                                                  children: (0, d.jsxs)("div", {
                                                    className:
                                                      "p-3 bg-white border rounded shadow-sm d-flex flex-column gap-3",
                                                    style: {
                                                      minHeight: "520px",
                                                    },
                                                    children: [
                                                      "business" === c &&
                                                        (0, d.jsxs)("div", {
                                                          children: [
                                                            (0, d.jsxs)("div", {
                                                              className:
                                                                "d-flex justify-content-between align-items-center mb-3",
                                                              children: [
                                                                (0, d.jsxs)(
                                                                  "h6",
                                                                  {
                                                                    className:
                                                                      "fw-bold mb-0 text-primary d-flex align-items-center gap-1",
                                                                    children: [
                                                                      (0,
                                                                      d.jsx)(
                                                                        G,
                                                                        {
                                                                          size: 18,
                                                                        },
                                                                      ),
                                                                      " Configurar Giro de Negocio",
                                                                    ],
                                                                  },
                                                                ),
                                                                (0, d.jsxs)(
                                                                  A.A,
                                                                  {
                                                                    variant:
                                                                      "link",
                                                                    size: "sm",
                                                                    className:
                                                                      "p-0 text-decoration-none text-primary small d-flex align-items-center gap-1",
                                                                    onClick:
                                                                      () =>
                                                                        n(
                                                                          (
                                                                            a,
                                                                          ) => ({
                                                                            ...a,
                                                                            "ai.business.type":
                                                                              aw[
                                                                                "ai.business.type"
                                                                              ],
                                                                          }),
                                                                        ),
                                                                    style: {
                                                                      fontSize:
                                                                        "0.75rem",
                                                                    },
                                                                    children: [
                                                                      (0,
                                                                      d.jsx)(
                                                                        W,
                                                                        {
                                                                          size: 10,
                                                                        },
                                                                      ),
                                                                      " Restaurar Defecto",
                                                                    ],
                                                                  },
                                                                ),
                                                              ],
                                                            }),
                                                            (0, d.jsxs)(
                                                              x.A.Group,
                                                              {
                                                                className:
                                                                  "mb-3",
                                                                children: [
                                                                  (0, d.jsx)(
                                                                    x.A.Label,
                                                                    {
                                                                      className:
                                                                        "small fw-semibold",
                                                                      children:
                                                                        "Tipo de Conversaci\xf3n a Automatizar:",
                                                                    },
                                                                  ),
                                                                  (0, d.jsxs)(
                                                                    x.A.Select,
                                                                    {
                                                                      name: "ai.business.type",
                                                                      value:
                                                                        m[
                                                                          "ai.business.type"
                                                                        ] ||
                                                                        "ECOMMERCE",
                                                                      onChange:
                                                                        aI,
                                                                      style: {
                                                                        fontSize:
                                                                          "0.85rem",
                                                                      },
                                                                      children:
                                                                        [
                                                                          (0,
                                                                          d.jsx)(
                                                                            "option",
                                                                            {
                                                                              value:
                                                                                "ECOMMERCE",
                                                                              children:
                                                                                "\uD83D\uDED2 E-commerce (Venta de Productos)",
                                                                            },
                                                                          ),
                                                                          (0,
                                                                          d.jsx)(
                                                                            "option",
                                                                            {
                                                                              value:
                                                                                "SERVICES",
                                                                              children:
                                                                                "\uD83D\uDCC5 Servicios y Citas (Agendamientos)",
                                                                            },
                                                                          ),
                                                                          (0,
                                                                          d.jsx)(
                                                                            "option",
                                                                            {
                                                                              value:
                                                                                "RESERVATIONS",
                                                                              children:
                                                                                "\uD83C\uDFE8 Reservaciones (Hoteles / Restaurantes)",
                                                                            },
                                                                          ),
                                                                          (0,
                                                                          d.jsx)(
                                                                            "option",
                                                                            {
                                                                              value:
                                                                                "LEADS",
                                                                              children:
                                                                                "\uD83C\uDFE2 Captaci\xf3n de Clientes / Leads B2B",
                                                                            },
                                                                          ),
                                                                        ],
                                                                    },
                                                                  ),
                                                                ],
                                                              },
                                                            ),
                                                            (0, d.jsxs)("div", {
                                                              className:
                                                                "alert alert-warning small py-2 mt-2",
                                                              style: {
                                                                fontSize:
                                                                  "0.78rem",
                                                              },
                                                              children: [
                                                                (0, d.jsx)(
                                                                  "strong",
                                                                  {
                                                                    children:
                                                                      "Nota T\xe9cnica:",
                                                                  },
                                                                ),
                                                                " El Giro del negocio define c\xf3mo se estructuran las respuestas cognitivas del modelo Gemini para vender o captar prospectos.",
                                                              ],
                                                            }),
                                                          ],
                                                        }),
                                                      "welcome" === c &&
                                                        (0, d.jsxs)("div", {
                                                          children: [
                                                            (0, d.jsxs)("div", {
                                                              className:
                                                                "d-flex justify-content-between align-items-center mb-2",
                                                              children: [
                                                                (0, d.jsxs)(
                                                                  "h6",
                                                                  {
                                                                    className:
                                                                      "fw-bold mb-0 text-success d-flex align-items-center gap-1",
                                                                    children: [
                                                                      (0,
                                                                      d.jsx)(
                                                                        U,
                                                                        {
                                                                          size: 18,
                                                                        },
                                                                      ),
                                                                      " Saludo (Cliente Nuevo)",
                                                                    ],
                                                                  },
                                                                ),
                                                                (0, d.jsxs)(
                                                                  A.A,
                                                                  {
                                                                    variant:
                                                                      "link",
                                                                    size: "sm",
                                                                    className:
                                                                      "p-0 text-decoration-none text-primary small d-flex align-items-center gap-1",
                                                                    onClick:
                                                                      () =>
                                                                        n(
                                                                          (
                                                                            a,
                                                                          ) => ({
                                                                            ...a,
                                                                            "ai.greeting.new":
                                                                              aw[
                                                                                "ai.greeting.new"
                                                                              ],
                                                                          }),
                                                                        ),
                                                                    style: {
                                                                      fontSize:
                                                                        "0.75rem",
                                                                    },
                                                                    children: [
                                                                      (0,
                                                                      d.jsx)(
                                                                        W,
                                                                        {
                                                                          size: 10,
                                                                        },
                                                                      ),
                                                                      " Restaurar Ejemplo",
                                                                    ],
                                                                  },
                                                                ),
                                                              ],
                                                            }),
                                                            (0, d.jsx)(
                                                              x.A.Control,
                                                              {
                                                                as: "textarea",
                                                                rows: 5,
                                                                name: "ai.greeting.new",
                                                                value:
                                                                  m[
                                                                    "ai.greeting.new"
                                                                  ] || "",
                                                                onChange: aI,
                                                                placeholder:
                                                                  "Ej: \xa1Hola! Bienvenido a nuestro negocio...",
                                                                style: {
                                                                  fontSize:
                                                                    "0.82rem",
                                                                },
                                                              },
                                                            ),
                                                            (0, d.jsx)("h6", {
                                                              className:
                                                                "fw-bold small mt-3 mb-2 text-muted",
                                                              children:
                                                                "Simulaci\xf3n en WhatsApp:",
                                                            }),
                                                            (0, d.jsx)("div", {
                                                              className:
                                                                "p-2 rounded shadow-inner",
                                                              style: {
                                                                backgroundColor:
                                                                  "#efeae2",
                                                                backgroundImage:
                                                                  'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                                                                backgroundSize:
                                                                  "contain",
                                                                border:
                                                                  "1px solid #d1d7db",
                                                              },
                                                              children: (0,
                                                              d.jsx)("div", {
                                                                className:
                                                                  "d-flex flex-column mb-1",
                                                                style: {
                                                                  maxWidth:
                                                                    "85%",
                                                                },
                                                                children: (0,
                                                                d.jsxs)("div", {
                                                                  className:
                                                                    "bg-white p-2 rounded text-dark position-relative shadow-sm small",
                                                                  style: {
                                                                    borderRadius:
                                                                      "0px 10px 10px 10px",
                                                                  },
                                                                  children: [
                                                                    (0, d.jsx)(
                                                                      "span",
                                                                      {
                                                                        className:
                                                                          "fw-semibold text-success d-block mb-1",
                                                                        style: {
                                                                          fontSize:
                                                                            "0.7rem",
                                                                        },
                                                                        children:
                                                                          "\uD83E\uDD16 Asesor IA:",
                                                                      },
                                                                    ),
                                                                    (0, d.jsx)(
                                                                      "span",
                                                                      {
                                                                        style: {
                                                                          fontSize:
                                                                            "0.8rem",
                                                                        },
                                                                        children:
                                                                          aH(
                                                                            m[
                                                                              "ai.greeting.new"
                                                                            ] ||
                                                                              aw[
                                                                                "ai.greeting.new"
                                                                              ],
                                                                          ),
                                                                      },
                                                                    ),
                                                                    (0, d.jsx)(
                                                                      "div",
                                                                      {
                                                                        className:
                                                                          "text-muted text-end mt-1",
                                                                        style: {
                                                                          fontSize:
                                                                            "0.58rem",
                                                                        },
                                                                        children:
                                                                          "10:40 AM ✔✔",
                                                                      },
                                                                    ),
                                                                  ],
                                                                }),
                                                              }),
                                                            }),
                                                          ],
                                                        }),
                                                      "registered" === c &&
                                                        (0, d.jsxs)("div", {
                                                          children: [
                                                            (0, d.jsxs)("div", {
                                                              className:
                                                                "d-flex justify-content-between align-items-center mb-2",
                                                              children: [
                                                                (0, d.jsxs)(
                                                                  "h6",
                                                                  {
                                                                    className:
                                                                      "fw-bold mb-0 text-success d-flex align-items-center gap-1",
                                                                    children: [
                                                                      (0,
                                                                      d.jsx)(
                                                                        W,
                                                                        {
                                                                          size: 18,
                                                                        },
                                                                      ),
                                                                      " Saludo (Cliente Registrado)",
                                                                    ],
                                                                  },
                                                                ),
                                                                (0, d.jsxs)(
                                                                  A.A,
                                                                  {
                                                                    variant:
                                                                      "link",
                                                                    size: "sm",
                                                                    className:
                                                                      "p-0 text-decoration-none text-primary small d-flex align-items-center gap-1",
                                                                    onClick:
                                                                      () =>
                                                                        n(
                                                                          (
                                                                            a,
                                                                          ) => ({
                                                                            ...a,
                                                                            "ai.greeting.registered":
                                                                              aw[
                                                                                "ai.greeting.registered"
                                                                              ],
                                                                          }),
                                                                        ),
                                                                    style: {
                                                                      fontSize:
                                                                        "0.75rem",
                                                                    },
                                                                    children: [
                                                                      (0,
                                                                      d.jsx)(
                                                                        W,
                                                                        {
                                                                          size: 10,
                                                                        },
                                                                      ),
                                                                      " Restaurar Ejemplo",
                                                                    ],
                                                                  },
                                                                ),
                                                              ],
                                                            }),
                                                            (0, d.jsx)(
                                                              x.A.Control,
                                                              {
                                                                as: "textarea",
                                                                rows: 5,
                                                                name: "ai.greeting.registered",
                                                                value:
                                                                  m[
                                                                    "ai.greeting.registered"
                                                                  ] || "",
                                                                onChange: aI,
                                                                placeholder:
                                                                  "Ej: Hola, *[Nombre]*...",
                                                                style: {
                                                                  fontSize:
                                                                    "0.82rem",
                                                                },
                                                              },
                                                            ),
                                                            (0, d.jsx)("h6", {
                                                              className:
                                                                "fw-bold small mt-3 mb-2 text-muted",
                                                              children:
                                                                "Simulaci\xf3n en WhatsApp:",
                                                            }),
                                                            (0, d.jsx)("div", {
                                                              className:
                                                                "p-2 rounded shadow-inner",
                                                              style: {
                                                                backgroundColor:
                                                                  "#efeae2",
                                                                backgroundImage:
                                                                  'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                                                                backgroundSize:
                                                                  "contain",
                                                                border:
                                                                  "1px solid #d1d7db",
                                                              },
                                                              children: (0,
                                                              d.jsx)("div", {
                                                                className:
                                                                  "d-flex flex-column mb-1",
                                                                style: {
                                                                  maxWidth:
                                                                    "85%",
                                                                },
                                                                children: (0,
                                                                d.jsxs)("div", {
                                                                  className:
                                                                    "bg-white p-2 rounded text-dark position-relative shadow-sm small",
                                                                  style: {
                                                                    borderRadius:
                                                                      "0px 10px 10px 10px",
                                                                  },
                                                                  children: [
                                                                    (0, d.jsx)(
                                                                      "span",
                                                                      {
                                                                        className:
                                                                          "fw-semibold text-success d-block mb-1",
                                                                        style: {
                                                                          fontSize:
                                                                            "0.7rem",
                                                                        },
                                                                        children:
                                                                          "\uD83E\uDD16 Asesor IA:",
                                                                      },
                                                                    ),
                                                                    (0, d.jsx)(
                                                                      "span",
                                                                      {
                                                                        style: {
                                                                          fontSize:
                                                                            "0.8rem",
                                                                        },
                                                                        children:
                                                                          aH(
                                                                            (
                                                                              m[
                                                                                "ai.greeting.registered"
                                                                              ] ||
                                                                              aw[
                                                                                "ai.greeting.registered"
                                                                              ]
                                                                            ).replace(
                                                                              "[Nombre]",
                                                                              "Juan",
                                                                            ),
                                                                          ),
                                                                      },
                                                                    ),
                                                                    (0, d.jsx)(
                                                                      "div",
                                                                      {
                                                                        className:
                                                                          "text-muted text-end mt-1",
                                                                        style: {
                                                                          fontSize:
                                                                            "0.58rem",
                                                                        },
                                                                        children:
                                                                          "10:41 AM ✔✔",
                                                                      },
                                                                    ),
                                                                  ],
                                                                }),
                                                              }),
                                                            }),
                                                          ],
                                                        }),
                                                      "location" === c &&
                                                        (0, d.jsxs)("div", {
                                                          children: [
                                                            (0, d.jsxs)("div", {
                                                              className:
                                                                "d-flex align-items-center justify-content-between mb-3 p-2 bg-light rounded",
                                                              children: [
                                                                (0, d.jsxs)(
                                                                  x.A.Label,
                                                                  {
                                                                    className:
                                                                      "fw-bold mb-0 small text-info",
                                                                    children: [
                                                                      (0,
                                                                      d.jsx)(
                                                                        Y,
                                                                        {
                                                                          size: 16,
                                                                          className:
                                                                            "me-1",
                                                                        },
                                                                      ),
                                                                      " Activar Nodo de Ubicaci\xf3n GPS",
                                                                    ],
                                                                  },
                                                                ),
                                                                (0, d.jsx)(
                                                                  x.A.Check,
                                                                  {
                                                                    type: "switch",
                                                                    id: "flow-location-switch",
                                                                    checked:
                                                                      "true" ===
                                                                      m[
                                                                        "ai.collect.location"
                                                                      ],
                                                                    onChange: (
                                                                      a,
                                                                    ) =>
                                                                      n(
                                                                        (
                                                                          b,
                                                                        ) => ({
                                                                          ...b,
                                                                          "ai.collect.location":
                                                                            a
                                                                              .target
                                                                              .checked
                                                                              ? "true"
                                                                              : "false",
                                                                        }),
                                                                      ),
                                                                  },
                                                                ),
                                                              ],
                                                            }),
                                                            "true" ===
                                                            m[
                                                              "ai.collect.location"
                                                            ]
                                                              ? (0, d.jsxs)(
                                                                  d.Fragment,
                                                                  {
                                                                    children: [
                                                                      (0,
                                                                      d.jsxs)(
                                                                        "div",
                                                                        {
                                                                          className:
                                                                            "d-flex justify-content-between align-items-center mb-2",
                                                                          children:
                                                                            [
                                                                              (0,
                                                                              d.jsx)(
                                                                                x
                                                                                  .A
                                                                                  .Label,
                                                                                {
                                                                                  className:
                                                                                    "small fw-semibold mb-0",
                                                                                  children:
                                                                                    "Respuesta / Mensaje del bot:",
                                                                                },
                                                                              ),
                                                                              (0,
                                                                              d.jsxs)(
                                                                                A.A,
                                                                                {
                                                                                  variant:
                                                                                    "link",
                                                                                  size: "sm",
                                                                                  className:
                                                                                    "p-0 text-decoration-none text-primary small d-flex align-items-center gap-1",
                                                                                  onClick:
                                                                                    () =>
                                                                                      n(
                                                                                        (
                                                                                          a,
                                                                                        ) => ({
                                                                                          ...a,
                                                                                          "ai.collect.location.text":
                                                                                            aw[
                                                                                              "ai.collect.location.text"
                                                                                            ],
                                                                                        }),
                                                                                      ),
                                                                                  style:
                                                                                    {
                                                                                      fontSize:
                                                                                        "0.75rem",
                                                                                    },
                                                                                  children:
                                                                                    [
                                                                                      (0,
                                                                                      d.jsx)(
                                                                                        W,
                                                                                        {
                                                                                          size: 10,
                                                                                        },
                                                                                      ),
                                                                                      " Restaurar Regla",
                                                                                    ],
                                                                                },
                                                                              ),
                                                                            ],
                                                                        },
                                                                      ),
                                                                      (0,
                                                                      d.jsx)(
                                                                        x.A
                                                                          .Control,
                                                                        {
                                                                          as: "textarea",
                                                                          rows: 3,
                                                                          name: "ai.collect.location.text",
                                                                          value:
                                                                            m[
                                                                              "ai.collect.location.text"
                                                                            ] ||
                                                                            "",
                                                                          onChange:
                                                                            aI,
                                                                          style:
                                                                            {
                                                                              fontSize:
                                                                                "0.82rem",
                                                                            },
                                                                        },
                                                                      ),
                                                                      (0,
                                                                      d.jsx)(
                                                                        "h6",
                                                                        {
                                                                          className:
                                                                            "fw-bold small mt-3 mb-2 text-muted",
                                                                          children:
                                                                            "Simulaci\xf3n en WhatsApp:",
                                                                        },
                                                                      ),
                                                                      (0,
                                                                      d.jsxs)(
                                                                        "div",
                                                                        {
                                                                          className:
                                                                            "p-2 rounded shadow-inner",
                                                                          style:
                                                                            {
                                                                              backgroundColor:
                                                                                "#efeae2",
                                                                              backgroundImage:
                                                                                'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                                                                              backgroundSize:
                                                                                "contain",
                                                                              border:
                                                                                "1px solid #d1d7db",
                                                                            },
                                                                          children:
                                                                            [
                                                                              (0,
                                                                              d.jsx)(
                                                                                "div",
                                                                                {
                                                                                  className:
                                                                                    "d-flex flex-column mb-2",
                                                                                  style:
                                                                                    {
                                                                                      maxWidth:
                                                                                        "85%",
                                                                                    },
                                                                                  children:
                                                                                    (0,
                                                                                    d.jsxs)(
                                                                                      "div",
                                                                                      {
                                                                                        className:
                                                                                          "bg-white p-2 rounded text-dark position-relative shadow-sm small",
                                                                                        style:
                                                                                          {
                                                                                            borderRadius:
                                                                                              "0px 10px 10px 10px",
                                                                                          },
                                                                                        children:
                                                                                          [
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "span",
                                                                                              {
                                                                                                className:
                                                                                                  "fw-semibold text-success d-block mb-1",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.7rem",
                                                                                                  },
                                                                                                children:
                                                                                                  "\uD83E\uDD16 Asesor IA:",
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "span",
                                                                                              {
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.8rem",
                                                                                                  },
                                                                                                children:
                                                                                                  aH(
                                                                                                    m[
                                                                                                      "ai.collect.location.text"
                                                                                                    ] ||
                                                                                                      aw[
                                                                                                        "ai.collect.location.text"
                                                                                                      ],
                                                                                                  ),
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "div",
                                                                                              {
                                                                                                className:
                                                                                                  "text-muted text-end mt-1",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.58rem",
                                                                                                  },
                                                                                                children:
                                                                                                  "10:42 AM ✔✔",
                                                                                              },
                                                                                            ),
                                                                                          ],
                                                                                      },
                                                                                    ),
                                                                                },
                                                                              ),
                                                                              (0,
                                                                              d.jsx)(
                                                                                "div",
                                                                                {
                                                                                  className:
                                                                                    "d-flex flex-column align-items-end mb-1",
                                                                                  children:
                                                                                    (0,
                                                                                    d.jsxs)(
                                                                                      "div",
                                                                                      {
                                                                                        className:
                                                                                          "p-2 rounded text-dark position-relative shadow-sm small",
                                                                                        style:
                                                                                          {
                                                                                            maxWidth:
                                                                                              "85%",
                                                                                            backgroundColor:
                                                                                              "#d9fdd3",
                                                                                            borderRadius:
                                                                                              "10px 0px 10px 10px",
                                                                                          },
                                                                                        children:
                                                                                          [
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "span",
                                                                                              {
                                                                                                className:
                                                                                                  "fw-semibold text-primary d-block mb-1",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.7rem",
                                                                                                  },
                                                                                                children:
                                                                                                  "\uD83D\uDC64 Cliente:",
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsxs)(
                                                                                              "div",
                                                                                              {
                                                                                                className:
                                                                                                  "d-flex align-items-center gap-2 bg-light p-2 rounded border small",
                                                                                                children:
                                                                                                  [
                                                                                                    (0,
                                                                                                    d.jsx)(
                                                                                                      "span",
                                                                                                      {
                                                                                                        style:
                                                                                                          {
                                                                                                            fontSize:
                                                                                                              "1.2rem",
                                                                                                          },
                                                                                                        children:
                                                                                                          "\uD83D\uDCCD",
                                                                                                      },
                                                                                                    ),
                                                                                                    (0,
                                                                                                    d.jsxs)(
                                                                                                      "div",
                                                                                                      {
                                                                                                        className:
                                                                                                          "text-start",
                                                                                                        children:
                                                                                                          [
                                                                                                            (0,
                                                                                                            d.jsx)(
                                                                                                              "strong",
                                                                                                              {
                                                                                                                style:
                                                                                                                  {
                                                                                                                    fontSize:
                                                                                                                      "0.72rem",
                                                                                                                  },
                                                                                                                children:
                                                                                                                  "Ubicaci\xf3n compartida",
                                                                                                              },
                                                                                                            ),
                                                                                                            (0,
                                                                                                            d.jsx)(
                                                                                                              "br",
                                                                                                              {},
                                                                                                            ),
                                                                                                            (0,
                                                                                                            d.jsx)(
                                                                                                              "span",
                                                                                                              {
                                                                                                                className:
                                                                                                                  "text-muted",
                                                                                                                style:
                                                                                                                  {
                                                                                                                    fontSize:
                                                                                                                      "0.62rem",
                                                                                                                  },
                                                                                                                children:
                                                                                                                  "Ver mapa en WhatsApp",
                                                                                                              },
                                                                                                            ),
                                                                                                          ],
                                                                                                      },
                                                                                                    ),
                                                                                                  ],
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "div",
                                                                                              {
                                                                                                className:
                                                                                                  "text-muted text-end mt-1",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.58rem",
                                                                                                  },
                                                                                                children:
                                                                                                  "10:43 AM ✔✔",
                                                                                              },
                                                                                            ),
                                                                                          ],
                                                                                      },
                                                                                    ),
                                                                                },
                                                                              ),
                                                                            ],
                                                                        },
                                                                      ),
                                                                    ],
                                                                  },
                                                                )
                                                              : (0, d.jsx)(
                                                                  "div",
                                                                  {
                                                                    className:
                                                                      "alert alert-secondary small mb-0 py-2",
                                                                    children:
                                                                      "Este paso est\xe1 desactivado. El bot continuar\xe1 el flujo sin validar ni solicitar ubicaci\xf3n.",
                                                                  },
                                                                ),
                                                          ],
                                                        }),
                                                      "promotion" === c &&
                                                        (0, d.jsxs)("div", {
                                                          children: [
                                                            (0, d.jsxs)("div", {
                                                              className:
                                                                "d-flex align-items-center justify-content-between mb-3 p-2 bg-light rounded",
                                                              children: [
                                                                (0, d.jsxs)(
                                                                  x.A.Label,
                                                                  {
                                                                    className:
                                                                      "fw-bold mb-0 small text-warning",
                                                                    children: [
                                                                      (0,
                                                                      d.jsx)(
                                                                        $,
                                                                        {
                                                                          size: 16,
                                                                          className:
                                                                            "me-1",
                                                                        },
                                                                      ),
                                                                      " Activar Nodo de Promociones y Productos",
                                                                    ],
                                                                  },
                                                                ),
                                                                (0, d.jsx)(
                                                                  x.A.Check,
                                                                  {
                                                                    type: "switch",
                                                                    id: "flow-promotion-switch",
                                                                    checked:
                                                                      "true" ===
                                                                      m[
                                                                        "ai.products.promotion"
                                                                      ],
                                                                    onChange: (
                                                                      a,
                                                                    ) =>
                                                                      n(
                                                                        (
                                                                          b,
                                                                        ) => ({
                                                                          ...b,
                                                                          "ai.products.promotion":
                                                                            a
                                                                              .target
                                                                              .checked
                                                                              ? "true"
                                                                              : "false",
                                                                        }),
                                                                      ),
                                                                  },
                                                                ),
                                                              ],
                                                            }),
                                                            "true" ===
                                                            m[
                                                              "ai.products.promotion"
                                                            ]
                                                              ? (0, d.jsxs)(
                                                                  d.Fragment,
                                                                  {
                                                                    children: [
                                                                      (0,
                                                                      d.jsxs)(
                                                                        "div",
                                                                        {
                                                                          className:
                                                                            "d-flex justify-content-between align-items-center mb-2",
                                                                          children:
                                                                            [
                                                                              (0,
                                                                              d.jsx)(
                                                                                x
                                                                                  .A
                                                                                  .Label,
                                                                                {
                                                                                  className:
                                                                                    "small fw-semibold mb-0",
                                                                                  children:
                                                                                    "Mensaje con Ofertas / Productos:",
                                                                                },
                                                                              ),
                                                                              (0,
                                                                              d.jsxs)(
                                                                                A.A,
                                                                                {
                                                                                  variant:
                                                                                    "link",
                                                                                  size: "sm",
                                                                                  className:
                                                                                    "p-0 text-decoration-none text-primary small d-flex align-items-center gap-1",
                                                                                  onClick:
                                                                                    () =>
                                                                                      n(
                                                                                        (
                                                                                          a,
                                                                                        ) => ({
                                                                                          ...a,
                                                                                          "ai.products.promotion.text":
                                                                                            aw[
                                                                                              "ai.products.promotion.text"
                                                                                            ],
                                                                                        }),
                                                                                      ),
                                                                                  style:
                                                                                    {
                                                                                      fontSize:
                                                                                        "0.75rem",
                                                                                    },
                                                                                  children:
                                                                                    [
                                                                                      (0,
                                                                                      d.jsx)(
                                                                                        W,
                                                                                        {
                                                                                          size: 10,
                                                                                        },
                                                                                      ),
                                                                                      " Restaurar Ejemplo",
                                                                                    ],
                                                                                },
                                                                              ),
                                                                            ],
                                                                        },
                                                                      ),
                                                                      (0,
                                                                      d.jsx)(
                                                                        x.A
                                                                          .Control,
                                                                        {
                                                                          as: "textarea",
                                                                          rows: 4,
                                                                          name: "ai.products.promotion.text",
                                                                          value:
                                                                            m[
                                                                              "ai.products.promotion.text"
                                                                            ] ||
                                                                            "",
                                                                          onChange:
                                                                            aI,
                                                                          style:
                                                                            {
                                                                              fontSize:
                                                                                "0.82rem",
                                                                            },
                                                                        },
                                                                      ),
                                                                      (0,
                                                                      d.jsxs)(
                                                                        x.A
                                                                          .Group,
                                                                        {
                                                                          className:
                                                                            "mb-3 mt-3",
                                                                          children:
                                                                            [
                                                                              (0,
                                                                              d.jsx)(
                                                                                x
                                                                                  .A
                                                                                  .Label,
                                                                                {
                                                                                  className:
                                                                                    "small fw-semibold",
                                                                                  children:
                                                                                    "Tipo de Adjunto Multimedia:",
                                                                                },
                                                                              ),
                                                                              (0,
                                                                              d.jsxs)(
                                                                                x
                                                                                  .A
                                                                                  .Select,
                                                                                {
                                                                                  name: "ai.products.promotion.media.type",
                                                                                  value:
                                                                                    m[
                                                                                      "ai.products.promotion.media.type"
                                                                                    ] ||
                                                                                    "NONE",
                                                                                  onChange:
                                                                                    aI,
                                                                                  style:
                                                                                    {
                                                                                      fontSize:
                                                                                        "0.85rem",
                                                                                    },
                                                                                  children:
                                                                                    [
                                                                                      (0,
                                                                                      d.jsx)(
                                                                                        "option",
                                                                                        {
                                                                                          value:
                                                                                            "NONE",
                                                                                          children:
                                                                                            "Ninguno (Solo texto)",
                                                                                        },
                                                                                      ),
                                                                                      (0,
                                                                                      d.jsx)(
                                                                                        "option",
                                                                                        {
                                                                                          value:
                                                                                            "IMAGE",
                                                                                          children:
                                                                                            "Imagen promocional (WhatsApp Media ID o URL)",
                                                                                        },
                                                                                      ),
                                                                                    ],
                                                                                },
                                                                              ),
                                                                            ],
                                                                        },
                                                                      ),
                                                                      "IMAGE" ===
                                                                        m[
                                                                          "ai.products.promotion.media.type"
                                                                        ] &&
                                                                        (0,
                                                                        d.jsxs)(
                                                                          x.A
                                                                            .Group,
                                                                          {
                                                                            className:
                                                                              "mb-3",
                                                                            children:
                                                                              [
                                                                                (0,
                                                                                d.jsxs)(
                                                                                  "div",
                                                                                  {
                                                                                    className:
                                                                                      "d-flex justify-content-between align-items-center",
                                                                                    children:
                                                                                      [
                                                                                        (0,
                                                                                        d.jsx)(
                                                                                          x
                                                                                            .A
                                                                                            .Label,
                                                                                          {
                                                                                            className:
                                                                                              "small fw-semibold",
                                                                                            children:
                                                                                              "IDs de Im\xe1genes de WhatsApp o URLs (separadas por coma):",
                                                                                          },
                                                                                        ),
                                                                                        m[
                                                                                          "ai.products.promotion.media.ids"
                                                                                        ] &&
                                                                                          "" !==
                                                                                            m[
                                                                                              "ai.products.promotion.media.ids"
                                                                                            ].trim() &&
                                                                                          (0,
                                                                                          d.jsx)(
                                                                                            A.A,
                                                                                            {
                                                                                              variant:
                                                                                                "link",
                                                                                              size: "sm",
                                                                                              className:
                                                                                                "p-0 text-decoration-none text-danger small",
                                                                                              onClick:
                                                                                                () =>
                                                                                                  n(
                                                                                                    (
                                                                                                      a,
                                                                                                    ) => ({
                                                                                                      ...a,
                                                                                                      "ai.products.promotion.media.ids":
                                                                                                        "",
                                                                                                    }),
                                                                                                  ),
                                                                                              style:
                                                                                                {
                                                                                                  fontSize:
                                                                                                    "0.72rem",
                                                                                                },
                                                                                              children:
                                                                                                "Limpiar todo",
                                                                                            },
                                                                                          ),
                                                                                      ],
                                                                                  },
                                                                                ),
                                                                                (0,
                                                                                d.jsx)(
                                                                                  x
                                                                                    .A
                                                                                    .Control,
                                                                                  {
                                                                                    type: "text",
                                                                                    name: "ai.products.promotion.media.ids",
                                                                                    value:
                                                                                      m[
                                                                                        "ai.products.promotion.media.ids"
                                                                                      ] ||
                                                                                      "",
                                                                                    onChange:
                                                                                      aI,
                                                                                    placeholder:
                                                                                      "Ej: 128763529384, https://tu-sitio.com/banner.jpg",
                                                                                    style:
                                                                                      {
                                                                                        fontSize:
                                                                                          "0.82rem",
                                                                                      },
                                                                                  },
                                                                                ),
                                                                                (0,
                                                                                d.jsx)(
                                                                                  x
                                                                                    .A
                                                                                    .Text,
                                                                                  {
                                                                                    className:
                                                                                      "text-muted small",
                                                                                    children:
                                                                                      "Ingresa IDs de medios de WhatsApp o URLs web de im\xe1genes. Separa m\xfaltiples elementos con comas.",
                                                                                  },
                                                                                ),
                                                                                (0,
                                                                                d.jsxs)(
                                                                                  "div",
                                                                                  {
                                                                                    className:
                                                                                      "mt-2",
                                                                                    children:
                                                                                      [
                                                                                        (0,
                                                                                        d.jsx)(
                                                                                          "span",
                                                                                          {
                                                                                            className:
                                                                                              "text-muted d-block mb-1",
                                                                                            style:
                                                                                              {
                                                                                                fontSize:
                                                                                                  "0.75rem",
                                                                                                fontWeight:
                                                                                                  "500",
                                                                                              },
                                                                                            children:
                                                                                              "⚡ Seleccionar r\xe1pido desde Cat\xe1logo de Ventas:",
                                                                                          },
                                                                                        ),
                                                                                        (0,
                                                                                        d.jsxs)(
                                                                                          "div",
                                                                                          {
                                                                                            className:
                                                                                              "d-flex align-items-center gap-2 mt-1",
                                                                                            children:
                                                                                              [
                                                                                                r.length >
                                                                                                0
                                                                                                  ? (0,
                                                                                                    d.jsxs)(
                                                                                                      x
                                                                                                        .A
                                                                                                        .Select,
                                                                                                      {
                                                                                                        size: "sm",
                                                                                                        value:
                                                                                                          "",
                                                                                                        onChange:
                                                                                                          (
                                                                                                            a,
                                                                                                          ) => {
                                                                                                            let b =
                                                                                                              a
                                                                                                                .target
                                                                                                                .value;
                                                                                                            if (
                                                                                                              !b
                                                                                                            )
                                                                                                              return;
                                                                                                            let c =
                                                                                                              m[
                                                                                                                "ai.products.promotion.media.ids"
                                                                                                              ] ||
                                                                                                              "";
                                                                                                            if (
                                                                                                              c.includes(
                                                                                                                b,
                                                                                                              )
                                                                                                            )
                                                                                                              return;
                                                                                                            let d =
                                                                                                              "" ===
                                                                                                              c.trim()
                                                                                                                ? b
                                                                                                                : `${c}, ${b}`;
                                                                                                            n(
                                                                                                              (
                                                                                                                a,
                                                                                                              ) => ({
                                                                                                                ...a,
                                                                                                                "ai.products.promotion.media.ids":
                                                                                                                  d,
                                                                                                              }),
                                                                                                            );
                                                                                                          },
                                                                                                        style:
                                                                                                          {
                                                                                                            fontSize:
                                                                                                              "0.8rem",
                                                                                                          },
                                                                                                        children:
                                                                                                          [
                                                                                                            (0,
                                                                                                            d.jsx)(
                                                                                                              "option",
                                                                                                              {
                                                                                                                value:
                                                                                                                  "",
                                                                                                                children:
                                                                                                                  "-- Selecciona un producto para agregar --",
                                                                                                              },
                                                                                                            ),
                                                                                                            r.map(
                                                                                                              (
                                                                                                                a,
                                                                                                              ) => {
                                                                                                                let b = `${av}/api/productos/${a.productoId}/imagen`,
                                                                                                                  c =
                                                                                                                    a.mediaIdWhatsapp &&
                                                                                                                    "" !==
                                                                                                                      a.mediaIdWhatsapp.trim()
                                                                                                                      ? a.mediaIdWhatsapp
                                                                                                                      : b;
                                                                                                                return (0,
                                                                                                                d.jsxs)(
                                                                                                                  "option",
                                                                                                                  {
                                                                                                                    value:
                                                                                                                      c,
                                                                                                                    children:
                                                                                                                      [
                                                                                                                        a.productName,
                                                                                                                        " (",
                                                                                                                        a.mediaIdWhatsapp
                                                                                                                          ? `ID: ${a.mediaIdWhatsapp}`
                                                                                                                          : "Imagen",
                                                                                                                        ")",
                                                                                                                      ],
                                                                                                                  },
                                                                                                                  a.productoId,
                                                                                                                );
                                                                                                              },
                                                                                                            ),
                                                                                                          ],
                                                                                                      },
                                                                                                    )
                                                                                                  : (0,
                                                                                                    d.jsx)(
                                                                                                      "span",
                                                                                                      {
                                                                                                        className:
                                                                                                          "text-muted small",
                                                                                                        children:
                                                                                                          "No hay productos en el cat\xe1logo.",
                                                                                                      },
                                                                                                    ),
                                                                                                m[
                                                                                                  "ai.products.promotion.media.ids"
                                                                                                ] &&
                                                                                                  "" !==
                                                                                                    m[
                                                                                                      "ai.products.promotion.media.ids"
                                                                                                    ].trim() &&
                                                                                                  (0,
                                                                                                  d.jsx)(
                                                                                                    A.A,
                                                                                                    {
                                                                                                      variant:
                                                                                                        "outline-danger",
                                                                                                      size: "sm",
                                                                                                      onClick:
                                                                                                        () =>
                                                                                                          n(
                                                                                                            (
                                                                                                              a,
                                                                                                            ) => ({
                                                                                                              ...a,
                                                                                                              "ai.products.promotion.media.ids":
                                                                                                                "",
                                                                                                            }),
                                                                                                          ),
                                                                                                      style:
                                                                                                        {
                                                                                                          fontSize:
                                                                                                            "0.72rem",
                                                                                                          whiteSpace:
                                                                                                            "nowrap",
                                                                                                        },
                                                                                                      children:
                                                                                                        "Limpiar",
                                                                                                    },
                                                                                                  ),
                                                                                              ],
                                                                                          },
                                                                                        ),
                                                                                      ],
                                                                                  },
                                                                                ),
                                                                              ],
                                                                          },
                                                                        ),
                                                                      (0,
                                                                      d.jsx)(
                                                                        "h6",
                                                                        {
                                                                          className:
                                                                            "fw-bold small mt-3 mb-2 text-muted",
                                                                          children:
                                                                            "Simulaci\xf3n en WhatsApp:",
                                                                        },
                                                                      ),
                                                                      (0,
                                                                      d.jsxs)(
                                                                        "div",
                                                                        {
                                                                          className:
                                                                            "p-2 rounded shadow-inner",
                                                                          style:
                                                                            {
                                                                              backgroundColor:
                                                                                "#efeae2",
                                                                              backgroundImage:
                                                                                'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                                                                              backgroundSize:
                                                                                "contain",
                                                                              border:
                                                                                "1px solid #d1d7db",
                                                                            },
                                                                          children:
                                                                            [
                                                                              (0,
                                                                              d.jsxs)(
                                                                                "div",
                                                                                {
                                                                                  className:
                                                                                    "d-flex flex-column mb-2",
                                                                                  style:
                                                                                    {
                                                                                      maxWidth:
                                                                                        "85%",
                                                                                    },
                                                                                  children:
                                                                                    [
                                                                                      "IMAGE" ===
                                                                                        m[
                                                                                          "ai.products.promotion.media.type"
                                                                                        ] &&
                                                                                      m[
                                                                                        "ai.products.promotion.media.ids"
                                                                                      ] &&
                                                                                      "" !==
                                                                                        m[
                                                                                          "ai.products.promotion.media.ids"
                                                                                        ].trim()
                                                                                        ? (() => {
                                                                                            let a =
                                                                                                (
                                                                                                  m[
                                                                                                    "ai.products.promotion.media.ids"
                                                                                                  ] ||
                                                                                                  ""
                                                                                                ).split(
                                                                                                  ",",
                                                                                                ),
                                                                                              b =
                                                                                                [];
                                                                                            for (
                                                                                              let c = 0;
                                                                                              c <
                                                                                              a.length;
                                                                                              c++
                                                                                            ) {
                                                                                              let d =
                                                                                                a[
                                                                                                  c
                                                                                                ].trim();
                                                                                              d &&
                                                                                                (d.startsWith(
                                                                                                  "data:",
                                                                                                ) &&
                                                                                                d.includes(
                                                                                                  "base64",
                                                                                                ) &&
                                                                                                c +
                                                                                                  1 <
                                                                                                  a.length &&
                                                                                                !a[
                                                                                                  c +
                                                                                                    1
                                                                                                ].includes(
                                                                                                  "http",
                                                                                                ) &&
                                                                                                !a[
                                                                                                  c +
                                                                                                    1
                                                                                                ].startsWith(
                                                                                                  "data:",
                                                                                                )
                                                                                                  ? (b.push(
                                                                                                      d +
                                                                                                        "," +
                                                                                                        a[
                                                                                                          c +
                                                                                                            1
                                                                                                        ].trim(),
                                                                                                    ),
                                                                                                    c++)
                                                                                                  : b.push(
                                                                                                      d,
                                                                                                    ));
                                                                                            }
                                                                                            return b.map(
                                                                                              (
                                                                                                a,
                                                                                                b,
                                                                                              ) => {
                                                                                                let c =
                                                                                                    a.startsWith(
                                                                                                      "http",
                                                                                                    ) ||
                                                                                                    a.startsWith(
                                                                                                      "data:",
                                                                                                    ) ||
                                                                                                    a.startsWith(
                                                                                                      "/",
                                                                                                    ),
                                                                                                  e =
                                                                                                    r.find(
                                                                                                      (
                                                                                                        b,
                                                                                                      ) =>
                                                                                                        (b.mediaIdWhatsapp &&
                                                                                                          String(
                                                                                                            b.mediaIdWhatsapp,
                                                                                                          ).trim() ===
                                                                                                            a) ||
                                                                                                        (c &&
                                                                                                          b.productoId &&
                                                                                                          a.includes(
                                                                                                            `/api/productos/${b.productoId}/imagen`,
                                                                                                          )),
                                                                                                    ),
                                                                                                  f =
                                                                                                    e
                                                                                                      ? e.productImage &&
                                                                                                        e.productImage.startsWith(
                                                                                                          "data:",
                                                                                                        )
                                                                                                        ? e.productImage
                                                                                                        : `${av}/api/productos/${e.productoId}/imagen`
                                                                                                      : c
                                                                                                        ? a
                                                                                                        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="80" viewBox="0 0 24 24" fill="none" stroke="%238ec5fc" stroke-width="1.5"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E',
                                                                                                  g =
                                                                                                    "";
                                                                                                return (
                                                                                                  e &&
                                                                                                    (g =
                                                                                                      e.imageCaption ||
                                                                                                      `*${e.productName}*
💵 *Precio:* S/ ${e.productPrice || "0.00"}

${e.customAiDescription || ""}`),
                                                                                                  (0,
                                                                                                  d.jsxs)(
                                                                                                    "div",
                                                                                                    {
                                                                                                      className:
                                                                                                        "bg-white p-2 rounded text-dark position-relative shadow-sm small mb-2",
                                                                                                      style:
                                                                                                        {
                                                                                                          borderRadius:
                                                                                                            "0px 10px 10px 10px",
                                                                                                        },
                                                                                                      children:
                                                                                                        [
                                                                                                          (0,
                                                                                                          d.jsx)(
                                                                                                            "span",
                                                                                                            {
                                                                                                              className:
                                                                                                                "fw-semibold text-success d-block mb-1",
                                                                                                              style:
                                                                                                                {
                                                                                                                  fontSize:
                                                                                                                    "0.7rem",
                                                                                                                },
                                                                                                              children:
                                                                                                                "\uD83E\uDD16 Asesor IA:",
                                                                                                            },
                                                                                                          ),
                                                                                                          (0,
                                                                                                          d.jsx)(
                                                                                                            "div",
                                                                                                            {
                                                                                                              className:
                                                                                                                "mb-2 p-1 bg-light rounded text-center border",
                                                                                                              style:
                                                                                                                {
                                                                                                                  maxHeight:
                                                                                                                    "180px",
                                                                                                                  overflow:
                                                                                                                    "hidden",
                                                                                                                },
                                                                                                              children:
                                                                                                                (0,
                                                                                                                d.jsx)(
                                                                                                                  "img",
                                                                                                                  {
                                                                                                                    src: f,
                                                                                                                    alt: `Imagen ${b + 1}`,
                                                                                                                    className:
                                                                                                                      "img-fluid rounded",
                                                                                                                    style:
                                                                                                                      {
                                                                                                                        maxHeight:
                                                                                                                          "140px",
                                                                                                                        objectFit:
                                                                                                                          "contain",
                                                                                                                      },
                                                                                                                    onError:
                                                                                                                      (
                                                                                                                        a,
                                                                                                                      ) => {
                                                                                                                        a.target.src =
                                                                                                                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="80" viewBox="0 0 24 24" fill="none" stroke="%23ef4444" stroke-width="1.5"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3C/svg%3E';
                                                                                                                      },
                                                                                                                  },
                                                                                                                ),
                                                                                                            },
                                                                                                          ),
                                                                                                          g &&
                                                                                                            (0,
                                                                                                            d.jsx)(
                                                                                                              "span",
                                                                                                              {
                                                                                                                className:
                                                                                                                  "d-block mt-1",
                                                                                                                style:
                                                                                                                  {
                                                                                                                    fontSize:
                                                                                                                      "0.8rem",
                                                                                                                    whiteSpace:
                                                                                                                      "pre-wrap",
                                                                                                                  },
                                                                                                                children:
                                                                                                                  aH(
                                                                                                                    g,
                                                                                                                  ),
                                                                                                              },
                                                                                                            ),
                                                                                                          (0,
                                                                                                          d.jsx)(
                                                                                                            "div",
                                                                                                            {
                                                                                                              className:
                                                                                                                "text-muted text-end mt-1",
                                                                                                              style:
                                                                                                                {
                                                                                                                  fontSize:
                                                                                                                    "0.58rem",
                                                                                                                },
                                                                                                              children:
                                                                                                                "10:43 AM ✔✔",
                                                                                                            },
                                                                                                          ),
                                                                                                        ],
                                                                                                    },
                                                                                                    b,
                                                                                                  )
                                                                                                );
                                                                                              },
                                                                                            );
                                                                                          })()
                                                                                        : (0,
                                                                                          d.jsxs)(
                                                                                            "div",
                                                                                            {
                                                                                              className:
                                                                                                "bg-white p-2 rounded text-dark position-relative shadow-sm small mb-2",
                                                                                              style:
                                                                                                {
                                                                                                  borderRadius:
                                                                                                    "0px 10px 10px 10px",
                                                                                                },
                                                                                              children:
                                                                                                [
                                                                                                  (0,
                                                                                                  d.jsx)(
                                                                                                    "span",
                                                                                                    {
                                                                                                      className:
                                                                                                        "fw-semibold text-success d-block mb-1",
                                                                                                      style:
                                                                                                        {
                                                                                                          fontSize:
                                                                                                            "0.7rem",
                                                                                                        },
                                                                                                      children:
                                                                                                        "\uD83E\uDD16 Asesor IA:",
                                                                                                    },
                                                                                                  ),
                                                                                                  "IMAGE" ===
                                                                                                    m[
                                                                                                      "ai.products.promotion.media.type"
                                                                                                    ] &&
                                                                                                    (0,
                                                                                                    d.jsxs)(
                                                                                                      "div",
                                                                                                      {
                                                                                                        className:
                                                                                                          "mb-2 p-3 bg-light rounded text-center border text-muted small",
                                                                                                        children:
                                                                                                          [
                                                                                                            (0,
                                                                                                            d.jsx)(
                                                                                                              ag,
                                                                                                              {
                                                                                                                size: 20,
                                                                                                              },
                                                                                                            ),
                                                                                                            (0,
                                                                                                            d.jsx)(
                                                                                                              "br",
                                                                                                              {},
                                                                                                            ),
                                                                                                            "Imagen promocional (WhatsApp ID o URL)",
                                                                                                          ],
                                                                                                      },
                                                                                                    ),
                                                                                                  (0,
                                                                                                  d.jsx)(
                                                                                                    "span",
                                                                                                    {
                                                                                                      style:
                                                                                                        {
                                                                                                          fontSize:
                                                                                                            "0.8rem",
                                                                                                          whiteSpace:
                                                                                                            "pre-wrap",
                                                                                                        },
                                                                                                      children:
                                                                                                        aH(
                                                                                                          m[
                                                                                                            "ai.products.promotion.text"
                                                                                                          ] ||
                                                                                                            aw[
                                                                                                              "ai.products.promotion.text"
                                                                                                            ],
                                                                                                        ),
                                                                                                    },
                                                                                                  ),
                                                                                                  (0,
                                                                                                  d.jsx)(
                                                                                                    "div",
                                                                                                    {
                                                                                                      className:
                                                                                                        "text-muted text-end mt-1",
                                                                                                      style:
                                                                                                        {
                                                                                                          fontSize:
                                                                                                            "0.58rem",
                                                                                                        },
                                                                                                      children:
                                                                                                        "10:43 AM ✔✔",
                                                                                                    },
                                                                                                  ),
                                                                                                ],
                                                                                            },
                                                                                          ),
                                                                                      "IMAGE" ===
                                                                                        m[
                                                                                          "ai.products.promotion.media.type"
                                                                                        ] &&
                                                                                        m[
                                                                                          "ai.products.promotion.media.ids"
                                                                                        ] &&
                                                                                        "" !==
                                                                                          m[
                                                                                            "ai.products.promotion.media.ids"
                                                                                          ].trim() &&
                                                                                        (0,
                                                                                        d.jsxs)(
                                                                                          "div",
                                                                                          {
                                                                                            className:
                                                                                              "bg-white p-2 rounded text-dark position-relative shadow-sm small",
                                                                                            style:
                                                                                              {
                                                                                                borderRadius:
                                                                                                  "0px 10px 10px 10px",
                                                                                              },
                                                                                            children:
                                                                                              [
                                                                                                (0,
                                                                                                d.jsx)(
                                                                                                  "span",
                                                                                                  {
                                                                                                    className:
                                                                                                      "fw-semibold text-success d-block mb-1",
                                                                                                    style:
                                                                                                      {
                                                                                                        fontSize:
                                                                                                          "0.7rem",
                                                                                                      },
                                                                                                    children:
                                                                                                      "\uD83E\uDD16 Asesor IA (Mensaje):",
                                                                                                  },
                                                                                                ),
                                                                                                (0,
                                                                                                d.jsx)(
                                                                                                  "span",
                                                                                                  {
                                                                                                    style:
                                                                                                      {
                                                                                                        fontSize:
                                                                                                          "0.8rem",
                                                                                                        whiteSpace:
                                                                                                          "pre-wrap",
                                                                                                      },
                                                                                                    children:
                                                                                                      aH(
                                                                                                        m[
                                                                                                          "ai.products.promotion.text"
                                                                                                        ] ||
                                                                                                          aw[
                                                                                                            "ai.products.promotion.text"
                                                                                                          ],
                                                                                                      ),
                                                                                                  },
                                                                                                ),
                                                                                                (0,
                                                                                                d.jsx)(
                                                                                                  "div",
                                                                                                  {
                                                                                                    className:
                                                                                                      "text-muted text-end mt-1",
                                                                                                    style:
                                                                                                      {
                                                                                                        fontSize:
                                                                                                          "0.58rem",
                                                                                                      },
                                                                                                    children:
                                                                                                      "10:43 AM ✔✔",
                                                                                                  },
                                                                                                ),
                                                                                              ],
                                                                                          },
                                                                                        ),
                                                                                    ],
                                                                                },
                                                                              ),
                                                                              (0,
                                                                              d.jsx)(
                                                                                "div",
                                                                                {
                                                                                  className:
                                                                                    "d-flex flex-column align-items-end mb-1",
                                                                                  children:
                                                                                    (0,
                                                                                    d.jsxs)(
                                                                                      "div",
                                                                                      {
                                                                                        className:
                                                                                          "p-2 rounded text-dark position-relative shadow-sm small",
                                                                                        style:
                                                                                          {
                                                                                            maxWidth:
                                                                                              "85%",
                                                                                            backgroundColor:
                                                                                              "#d9fdd3",
                                                                                            borderRadius:
                                                                                              "10px 0px 10px 10px",
                                                                                          },
                                                                                        children:
                                                                                          [
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "span",
                                                                                              {
                                                                                                className:
                                                                                                  "fw-semibold text-primary d-block mb-1",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.7rem",
                                                                                                  },
                                                                                                children:
                                                                                                  "\uD83D\uDC64 Cliente:",
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "span",
                                                                                              {
                                                                                                children:
                                                                                                  "\xa1Excelente! Por favor agr\xe9game la promoci\xf3n de 3 recargas a mi pedido. \uD83D\uDC4D",
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "div",
                                                                                              {
                                                                                                className:
                                                                                                  "text-muted text-end mt-1",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.58rem",
                                                                                                  },
                                                                                                children:
                                                                                                  "10:44 AM ✔✔",
                                                                                              },
                                                                                            ),
                                                                                          ],
                                                                                      },
                                                                                    ),
                                                                                },
                                                                              ),
                                                                            ],
                                                                        },
                                                                      ),
                                                                    ],
                                                                  },
                                                                )
                                                              : (0, d.jsx)(
                                                                  "div",
                                                                  {
                                                                    className:
                                                                      "alert alert-secondary small mb-0 py-2",
                                                                    children:
                                                                      "Este paso est\xe1 desactivado. El bot no ofrecer\xe1 promociones proactivamente en este nodo.",
                                                                  },
                                                                ),
                                                          ],
                                                        }),
                                                      "billing" === c &&
                                                        (0, d.jsxs)("div", {
                                                          children: [
                                                            (0, d.jsxs)("div", {
                                                              className:
                                                                "d-flex align-items-center justify-content-between mb-3 p-2 bg-light rounded",
                                                              children: [
                                                                (0, d.jsxs)(
                                                                  x.A.Label,
                                                                  {
                                                                    className:
                                                                      "fw-bold mb-0 small text-info",
                                                                    children: [
                                                                      (0,
                                                                      d.jsx)(
                                                                        aa,
                                                                        {
                                                                          size: 16,
                                                                          className:
                                                                            "me-1",
                                                                        },
                                                                      ),
                                                                      " Activar Nodo de Facturaci\xf3n",
                                                                    ],
                                                                  },
                                                                ),
                                                                (0, d.jsx)(
                                                                  x.A.Check,
                                                                  {
                                                                    type: "switch",
                                                                    id: "flow-billing-switch",
                                                                    checked:
                                                                      "true" ===
                                                                      m[
                                                                        "ai.collect.document"
                                                                      ],
                                                                    onChange: (
                                                                      a,
                                                                    ) =>
                                                                      n(
                                                                        (
                                                                          b,
                                                                        ) => ({
                                                                          ...b,
                                                                          "ai.collect.document":
                                                                            a
                                                                              .target
                                                                              .checked
                                                                              ? "true"
                                                                              : "false",
                                                                        }),
                                                                      ),
                                                                  },
                                                                ),
                                                              ],
                                                            }),
                                                            "true" ===
                                                            m[
                                                              "ai.collect.document"
                                                            ]
                                                              ? (0, d.jsxs)(
                                                                  d.Fragment,
                                                                  {
                                                                    children: [
                                                                      (0,
                                                                      d.jsxs)(
                                                                        "div",
                                                                        {
                                                                          className:
                                                                            "d-flex justify-content-between align-items-center mb-2",
                                                                          children:
                                                                            [
                                                                              (0,
                                                                              d.jsx)(
                                                                                x
                                                                                  .A
                                                                                  .Label,
                                                                                {
                                                                                  className:
                                                                                    "small fw-semibold mb-0",
                                                                                  children:
                                                                                    "Respuesta / Mensaje del bot:",
                                                                                },
                                                                              ),
                                                                              (0,
                                                                              d.jsxs)(
                                                                                A.A,
                                                                                {
                                                                                  variant:
                                                                                    "link",
                                                                                  size: "sm",
                                                                                  className:
                                                                                    "p-0 text-decoration-none text-primary small d-flex align-items-center gap-1",
                                                                                  onClick:
                                                                                    () =>
                                                                                      n(
                                                                                        (
                                                                                          a,
                                                                                        ) => ({
                                                                                          ...a,
                                                                                          "ai.collect.document.text":
                                                                                            aw[
                                                                                              "ai.collect.document.text"
                                                                                            ],
                                                                                        }),
                                                                                      ),
                                                                                  style:
                                                                                    {
                                                                                      fontSize:
                                                                                        "0.75rem",
                                                                                    },
                                                                                  children:
                                                                                    [
                                                                                      (0,
                                                                                      d.jsx)(
                                                                                        W,
                                                                                        {
                                                                                          size: 10,
                                                                                        },
                                                                                      ),
                                                                                      " Restaurar Regla",
                                                                                    ],
                                                                                },
                                                                              ),
                                                                            ],
                                                                        },
                                                                      ),
                                                                      (0,
                                                                      d.jsx)(
                                                                        x.A
                                                                          .Control,
                                                                        {
                                                                          as: "textarea",
                                                                          rows: 3,
                                                                          name: "ai.collect.document.text",
                                                                          value:
                                                                            m[
                                                                              "ai.collect.document.text"
                                                                            ] ||
                                                                            "",
                                                                          onChange:
                                                                            aI,
                                                                          style:
                                                                            {
                                                                              fontSize:
                                                                                "0.82rem",
                                                                            },
                                                                        },
                                                                      ),
                                                                      (0,
                                                                      d.jsx)(
                                                                        "h6",
                                                                        {
                                                                          className:
                                                                            "fw-bold small mt-3 mb-2 text-muted",
                                                                          children:
                                                                            "Simulaci\xf3n en WhatsApp:",
                                                                        },
                                                                      ),
                                                                      (0,
                                                                      d.jsxs)(
                                                                        "div",
                                                                        {
                                                                          className:
                                                                            "p-2 rounded shadow-inner",
                                                                          style:
                                                                            {
                                                                              backgroundColor:
                                                                                "#efeae2",
                                                                              backgroundImage:
                                                                                'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                                                                              backgroundSize:
                                                                                "contain",
                                                                              border:
                                                                                "1px solid #d1d7db",
                                                                            },
                                                                          children:
                                                                            [
                                                                              (0,
                                                                              d.jsx)(
                                                                                "div",
                                                                                {
                                                                                  className:
                                                                                    "d-flex flex-column mb-2",
                                                                                  style:
                                                                                    {
                                                                                      maxWidth:
                                                                                        "85%",
                                                                                    },
                                                                                  children:
                                                                                    (0,
                                                                                    d.jsxs)(
                                                                                      "div",
                                                                                      {
                                                                                        className:
                                                                                          "bg-white p-2 rounded text-dark position-relative shadow-sm small",
                                                                                        style:
                                                                                          {
                                                                                            borderRadius:
                                                                                              "0px 10px 10px 10px",
                                                                                          },
                                                                                        children:
                                                                                          [
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "span",
                                                                                              {
                                                                                                className:
                                                                                                  "fw-semibold text-success d-block mb-1",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.7rem",
                                                                                                  },
                                                                                                children:
                                                                                                  "\uD83E\uDD16 Asesor IA:",
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "span",
                                                                                              {
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.8rem",
                                                                                                  },
                                                                                                children:
                                                                                                  aH(
                                                                                                    m[
                                                                                                      "ai.collect.document.text"
                                                                                                    ] ||
                                                                                                      aw[
                                                                                                        "ai.collect.document.text"
                                                                                                      ],
                                                                                                  ),
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "div",
                                                                                              {
                                                                                                className:
                                                                                                  "text-muted text-end mt-1",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.58rem",
                                                                                                  },
                                                                                                children:
                                                                                                  "10:44 AM ✔✔",
                                                                                              },
                                                                                            ),
                                                                                          ],
                                                                                      },
                                                                                    ),
                                                                                },
                                                                              ),
                                                                              (0,
                                                                              d.jsx)(
                                                                                "div",
                                                                                {
                                                                                  className:
                                                                                    "d-flex flex-column align-items-end mb-1",
                                                                                  children:
                                                                                    (0,
                                                                                    d.jsxs)(
                                                                                      "div",
                                                                                      {
                                                                                        className:
                                                                                          "p-2 rounded text-dark position-relative shadow-sm small",
                                                                                        style:
                                                                                          {
                                                                                            maxWidth:
                                                                                              "85%",
                                                                                            backgroundColor:
                                                                                              "#d9fdd3",
                                                                                            borderRadius:
                                                                                              "10px 0px 10px 10px",
                                                                                          },
                                                                                        children:
                                                                                          [
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "span",
                                                                                              {
                                                                                                className:
                                                                                                  "fw-semibold text-primary d-block mb-1",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.7rem",
                                                                                                  },
                                                                                                children:
                                                                                                  "\uD83D\uDC64 Cliente:",
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "span",
                                                                                              {
                                                                                                children:
                                                                                                  "Boleta por favor. Mi DNI es 48596039.",
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "div",
                                                                                              {
                                                                                                className:
                                                                                                  "text-muted text-end mt-1",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.58rem",
                                                                                                  },
                                                                                                children:
                                                                                                  "10:45 AM ✔✔",
                                                                                              },
                                                                                            ),
                                                                                          ],
                                                                                      },
                                                                                    ),
                                                                                },
                                                                              ),
                                                                            ],
                                                                        },
                                                                      ),
                                                                    ],
                                                                  },
                                                                )
                                                              : (0, d.jsx)(
                                                                  "div",
                                                                  {
                                                                    className:
                                                                      "alert alert-secondary small mb-0 py-2",
                                                                    children:
                                                                      "Este paso est\xe1 desactivado. El bot continuar\xe1 el flujo sin solicitar DNI / RUC.",
                                                                  },
                                                                ),
                                                          ],
                                                        }),
                                                      "container" === c &&
                                                        (0, d.jsxs)("div", {
                                                          children: [
                                                            (0, d.jsxs)("div", {
                                                              className:
                                                                "d-flex align-items-center justify-content-between mb-3 p-2 bg-light rounded",
                                                              children: [
                                                                (0, d.jsxs)(
                                                                  x.A.Label,
                                                                  {
                                                                    className:
                                                                      "fw-bold mb-0 small text-info",
                                                                    children: [
                                                                      (0,
                                                                      d.jsx)(
                                                                        ac,
                                                                        {
                                                                          size: 16,
                                                                          className:
                                                                            "me-1",
                                                                        },
                                                                      ),
                                                                      " Activar Nodo de Envase (20L)",
                                                                    ],
                                                                  },
                                                                ),
                                                                (0, d.jsx)(
                                                                  x.A.Check,
                                                                  {
                                                                    type: "switch",
                                                                    id: "flow-container-switch",
                                                                    checked:
                                                                      "true" ===
                                                                      m[
                                                                        "ai.ask.container"
                                                                      ],
                                                                    onChange: (
                                                                      a,
                                                                    ) =>
                                                                      n(
                                                                        (
                                                                          b,
                                                                        ) => ({
                                                                          ...b,
                                                                          "ai.ask.container":
                                                                            a
                                                                              .target
                                                                              .checked
                                                                              ? "true"
                                                                              : "false",
                                                                        }),
                                                                      ),
                                                                  },
                                                                ),
                                                              ],
                                                            }),
                                                            "true" ===
                                                            m[
                                                              "ai.ask.container"
                                                            ]
                                                              ? (0, d.jsxs)(
                                                                  d.Fragment,
                                                                  {
                                                                    children: [
                                                                      (0,
                                                                      d.jsxs)(
                                                                        "div",
                                                                        {
                                                                          className:
                                                                            "d-flex justify-content-between align-items-center mb-2",
                                                                          children:
                                                                            [
                                                                              (0,
                                                                              d.jsx)(
                                                                                x
                                                                                  .A
                                                                                  .Label,
                                                                                {
                                                                                  className:
                                                                                    "small fw-semibold mb-0",
                                                                                  children:
                                                                                    "Respuesta / Mensaje del bot:",
                                                                                },
                                                                              ),
                                                                              (0,
                                                                              d.jsxs)(
                                                                                A.A,
                                                                                {
                                                                                  variant:
                                                                                    "link",
                                                                                  size: "sm",
                                                                                  className:
                                                                                    "p-0 text-decoration-none text-primary small d-flex align-items-center gap-1",
                                                                                  onClick:
                                                                                    () =>
                                                                                      n(
                                                                                        (
                                                                                          a,
                                                                                        ) => ({
                                                                                          ...a,
                                                                                          "ai.ask.container.text":
                                                                                            aw[
                                                                                              "ai.ask.container.text"
                                                                                            ],
                                                                                        }),
                                                                                      ),
                                                                                  style:
                                                                                    {
                                                                                      fontSize:
                                                                                        "0.75rem",
                                                                                    },
                                                                                  children:
                                                                                    [
                                                                                      (0,
                                                                                      d.jsx)(
                                                                                        W,
                                                                                        {
                                                                                          size: 10,
                                                                                        },
                                                                                      ),
                                                                                      " Restaurar Regla",
                                                                                    ],
                                                                                },
                                                                              ),
                                                                            ],
                                                                        },
                                                                      ),
                                                                      (0,
                                                                      d.jsx)(
                                                                        x.A
                                                                          .Control,
                                                                        {
                                                                          as: "textarea",
                                                                          rows: 3,
                                                                          name: "ai.ask.container.text",
                                                                          value:
                                                                            m[
                                                                              "ai.ask.container.text"
                                                                            ] ||
                                                                            "",
                                                                          onChange:
                                                                            aI,
                                                                          style:
                                                                            {
                                                                              fontSize:
                                                                                "0.82rem",
                                                                            },
                                                                        },
                                                                      ),
                                                                      (0,
                                                                      d.jsx)(
                                                                        "h6",
                                                                        {
                                                                          className:
                                                                            "fw-bold small mt-3 mb-2 text-muted",
                                                                          children:
                                                                            "Simulaci\xf3n en WhatsApp:",
                                                                        },
                                                                      ),
                                                                      (0,
                                                                      d.jsxs)(
                                                                        "div",
                                                                        {
                                                                          className:
                                                                            "p-2 rounded shadow-inner",
                                                                          style:
                                                                            {
                                                                              backgroundColor:
                                                                                "#efeae2",
                                                                              backgroundImage:
                                                                                'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                                                                              backgroundSize:
                                                                                "contain",
                                                                              border:
                                                                                "1px solid #d1d7db",
                                                                            },
                                                                          children:
                                                                            [
                                                                              (0,
                                                                              d.jsx)(
                                                                                "div",
                                                                                {
                                                                                  className:
                                                                                    "d-flex flex-column mb-2",
                                                                                  style:
                                                                                    {
                                                                                      maxWidth:
                                                                                        "85%",
                                                                                    },
                                                                                  children:
                                                                                    (0,
                                                                                    d.jsxs)(
                                                                                      "div",
                                                                                      {
                                                                                        className:
                                                                                          "bg-white p-2 rounded text-dark position-relative shadow-sm small",
                                                                                        style:
                                                                                          {
                                                                                            borderRadius:
                                                                                              "0px 10px 10px 10px",
                                                                                          },
                                                                                        children:
                                                                                          [
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "span",
                                                                                              {
                                                                                                className:
                                                                                                  "fw-semibold text-success d-block mb-1",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.7rem",
                                                                                                  },
                                                                                                children:
                                                                                                  "\uD83E\uDD16 Asesor IA:",
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "span",
                                                                                              {
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.8rem",
                                                                                                  },
                                                                                                children:
                                                                                                  aH(
                                                                                                    m[
                                                                                                      "ai.ask.container.text"
                                                                                                    ] ||
                                                                                                      aw[
                                                                                                        "ai.ask.container.text"
                                                                                                      ],
                                                                                                  ),
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "div",
                                                                                              {
                                                                                                className:
                                                                                                  "text-muted text-end mt-1",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.58rem",
                                                                                                  },
                                                                                                children:
                                                                                                  "10:46 AM ✔✔",
                                                                                              },
                                                                                            ),
                                                                                          ],
                                                                                      },
                                                                                    ),
                                                                                },
                                                                              ),
                                                                              (0,
                                                                              d.jsx)(
                                                                                "div",
                                                                                {
                                                                                  className:
                                                                                    "d-flex flex-column align-items-end mb-1",
                                                                                  children:
                                                                                    (0,
                                                                                    d.jsxs)(
                                                                                      "div",
                                                                                      {
                                                                                        className:
                                                                                          "p-2 rounded text-dark position-relative shadow-sm small",
                                                                                        style:
                                                                                          {
                                                                                            maxWidth:
                                                                                              "85%",
                                                                                            backgroundColor:
                                                                                              "#d9fdd3",
                                                                                            borderRadius:
                                                                                              "10px 0px 10px 10px",
                                                                                          },
                                                                                        children:
                                                                                          [
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "span",
                                                                                              {
                                                                                                className:
                                                                                                  "fw-semibold text-primary d-block mb-1",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.7rem",
                                                                                                  },
                                                                                                children:
                                                                                                  "\uD83D\uDC64 Cliente:",
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "span",
                                                                                              {
                                                                                                children:
                                                                                                  "S\xed, cuento con el bid\xf3n vac\xedo listo para entregar. \uD83D\uDC4D",
                                                                                              },
                                                                                            ),
                                                                                            (0,
                                                                                            d.jsx)(
                                                                                              "div",
                                                                                              {
                                                                                                className:
                                                                                                  "text-muted text-end mt-1",
                                                                                                style:
                                                                                                  {
                                                                                                    fontSize:
                                                                                                      "0.58rem",
                                                                                                  },
                                                                                                children:
                                                                                                  "10:47 AM ✔✔",
                                                                                              },
                                                                                            ),
                                                                                          ],
                                                                                      },
                                                                                    ),
                                                                                },
                                                                              ),
                                                                            ],
                                                                        },
                                                                      ),
                                                                    ],
                                                                  },
                                                                )
                                                              : (0, d.jsx)(
                                                                  "div",
                                                                  {
                                                                    className:
                                                                      "alert alert-secondary small mb-0 py-2",
                                                                    children:
                                                                      "Este paso est\xe1 desactivado. El bot continuar\xe1 el flujo sin validar tenencia de envases de 20L.",
                                                                  },
                                                                ),
                                                          ],
                                                        }),
                                                      "payment" === c &&
                                                        (0, d.jsxs)("div", {
                                                          children: [
                                                            (0, d.jsxs)("div", {
                                                              className:
                                                                "d-flex justify-content-between align-items-center mb-2",
                                                              children: [
                                                                (0, d.jsxs)(
                                                                  "h6",
                                                                  {
                                                                    className:
                                                                      "fw-bold mb-0 text-warning d-flex align-items-center gap-1",
                                                                    children: [
                                                                      (0,
                                                                      d.jsx)(
                                                                        ae,
                                                                        {
                                                                          size: 18,
                                                                        },
                                                                      ),
                                                                      " M\xe9todos de Pago Aceptados",
                                                                    ],
                                                                  },
                                                                ),
                                                                (0, d.jsxs)(
                                                                  A.A,
                                                                  {
                                                                    variant:
                                                                      "link",
                                                                    size: "sm",
                                                                    className:
                                                                      "p-0 text-decoration-none text-primary small d-flex align-items-center gap-1",
                                                                    onClick:
                                                                      () =>
                                                                        n(
                                                                          (
                                                                            a,
                                                                          ) => ({
                                                                            ...a,
                                                                            "ai.payment.methods":
                                                                              aw[
                                                                                "ai.payment.methods"
                                                                              ],
                                                                          }),
                                                                        ),
                                                                    style: {
                                                                      fontSize:
                                                                        "0.75rem",
                                                                    },
                                                                    children: [
                                                                      (0,
                                                                      d.jsx)(
                                                                        W,
                                                                        {
                                                                          size: 10,
                                                                        },
                                                                      ),
                                                                      " Restaurar Ejemplo",
                                                                    ],
                                                                  },
                                                                ),
                                                              ],
                                                            }),
                                                            (0, d.jsx)(
                                                              x.A.Control,
                                                              {
                                                                type: "text",
                                                                name: "ai.payment.methods",
                                                                value:
                                                                  m[
                                                                    "ai.payment.methods"
                                                                  ] || "",
                                                                onChange: aI,
                                                                placeholder:
                                                                  "Ej: Yape, Plin, Efectivo...",
                                                                style: {
                                                                  fontSize:
                                                                    "0.82rem",
                                                                },
                                                              },
                                                            ),
                                                            (0, d.jsxs)("div", {
                                                              className:
                                                                "alert alert-info small py-2 mt-3 mb-0",
                                                              style: {
                                                                fontSize:
                                                                  "0.78rem",
                                                              },
                                                              children: [
                                                                (0, d.jsx)(
                                                                  "strong",
                                                                  {
                                                                    children:
                                                                      "Tip:",
                                                                  },
                                                                ),
                                                                " Indica claramente las pasarelas o alternativas de cobro contra-entrega.",
                                                              ],
                                                            }),
                                                          ],
                                                        }),
                                                      "custom" === c &&
                                                        (0, d.jsxs)("div", {
                                                          children: [
                                                            (0, d.jsxs)("div", {
                                                              className:
                                                                "d-flex justify-content-between align-items-center mb-2",
                                                              children: [
                                                                (0, d.jsxs)(
                                                                  "h6",
                                                                  {
                                                                    className:
                                                                      "fw-bold mb-0 text-secondary d-flex align-items-center gap-1",
                                                                    children: [
                                                                      (0,
                                                                      d.jsx)(
                                                                        S,
                                                                        {
                                                                          size: 18,
                                                                        },
                                                                      ),
                                                                      " Instrucciones Adicionales",
                                                                    ],
                                                                  },
                                                                ),
                                                                (0, d.jsxs)(
                                                                  A.A,
                                                                  {
                                                                    variant:
                                                                      "link",
                                                                    size: "sm",
                                                                    className:
                                                                      "p-0 text-decoration-none text-primary small d-flex align-items-center gap-1",
                                                                    onClick:
                                                                      () =>
                                                                        n(
                                                                          (
                                                                            a,
                                                                          ) => ({
                                                                            ...a,
                                                                            "ai.custom.instructions":
                                                                              aw[
                                                                                "ai.custom.instructions"
                                                                              ],
                                                                          }),
                                                                        ),
                                                                    style: {
                                                                      fontSize:
                                                                        "0.75rem",
                                                                    },
                                                                    children: [
                                                                      (0,
                                                                      d.jsx)(
                                                                        W,
                                                                        {
                                                                          size: 10,
                                                                        },
                                                                      ),
                                                                      " Restaurar Ejemplo",
                                                                    ],
                                                                  },
                                                                ),
                                                              ],
                                                            }),
                                                            (0, d.jsx)(
                                                              x.A.Control,
                                                              {
                                                                as: "textarea",
                                                                rows: 5,
                                                                name: "ai.custom.instructions",
                                                                value:
                                                                  m[
                                                                    "ai.custom.instructions"
                                                                  ] || "",
                                                                onChange: aI,
                                                                placeholder:
                                                                  "Reglas de negocio personalizadas...",
                                                                style: {
                                                                  fontSize:
                                                                    "0.82rem",
                                                                },
                                                              },
                                                            ),
                                                          ],
                                                        }),
                                                    ],
                                                  }),
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              }),
                            }),
                            (0, d.jsx)("div", {
                              className: "d-flex justify-content-end mt-4",
                              children: (0, d.jsxs)(A.A, {
                                variant: "success",
                                type: "submit",
                                size: "lg",
                                disabled: ay,
                                style: { borderRadius: "8px" },
                                children: [
                                  ay
                                    ? (0, d.jsx)(h.A, {
                                        size: "sm",
                                        className: "me-2",
                                      })
                                    : (0, d.jsx)(O, {
                                        size: 18,
                                        className: "me-2",
                                      }),
                                  "Guardar Configuraci\xf3n de IA",
                                ],
                              }),
                            }),
                          ],
                        }),
                      }),
                      (0, d.jsx)(w.A, {
                        eventKey: "products",
                        title: (0, d.jsxs)("span", {
                          children: [
                            (0, d.jsx)(ac, { size: 18, className: "me-1" }),
                            " Cat\xe1logo de Venta",
                          ],
                        }),
                        children: (0, d.jsxs)(y.A, {
                          className: "shadow-sm border-0",
                          style: { borderRadius: "12px" },
                          children: [
                            (0, d.jsx)(y.A.Header, {
                              className:
                                "bg-light border-0 py-3 d-flex justify-content-between align-items-center",
                              children: (0, d.jsxs)("div", {
                                children: [
                                  (0, d.jsx)("h5", {
                                    className: "mb-0 fw-bold",
                                    children:
                                      "Productos Disponibles para el Agente",
                                  }),
                                  (0, d.jsx)("p", {
                                    className: "text-muted mb-0 small",
                                    children:
                                      "Activa o desactiva qu\xe9 productos puede vender la IA, config\xfaralos o previsualiza c\xf3mo se enviar\xe1n en WhatsApp.",
                                  }),
                                ],
                              }),
                            }),
                            (0, d.jsx)(y.A.Body, {
                              className: "p-0",
                              style: { overflowX: "auto" },
                              children: (0, d.jsxs)(B.A, {
                                responsive: !0,
                                hover: !0,
                                className: "mb-0 align-middle",
                                children: [
                                  (0, d.jsx)("thead", {
                                    className: "table-light",
                                    children: (0, d.jsxs)("tr", {
                                      children: [
                                        (0, d.jsx)("th", {
                                          style: {
                                            width: "100px",
                                            textAlign: "center",
                                          },
                                          children: "Vende IA",
                                        }),
                                        (0, d.jsx)("th", {
                                          children: "C\xf3digo / Nombre",
                                        }),
                                        (0, d.jsx)("th", {
                                          children: "Precio",
                                        }),
                                        (0, d.jsx)("th", {
                                          children: "Configuraci\xf3n IA",
                                        }),
                                        (0, d.jsx)("th", {
                                          style: {
                                            width: "280px",
                                            textAlign: "center",
                                          },
                                          children: "Acciones",
                                        }),
                                      ],
                                    }),
                                  }),
                                  (0, d.jsx)("tbody", {
                                    children: r.map((a, b) =>
                                      (0, d.jsxs)(
                                        "tr",
                                        {
                                          children: [
                                            (0, d.jsx)("td", {
                                              className: "text-center",
                                              children: (0, d.jsx)(x.A.Check, {
                                                type: "switch",
                                                id: `prod-toggle-${a.productoId}`,
                                                checked: a.aiEnabled,
                                                onChange: () =>
                                                  aK(b, a.aiEnabled),
                                                style: {
                                                  fontSize: "1.2rem",
                                                  cursor: "pointer",
                                                },
                                              }),
                                            }),
                                            (0, d.jsx)("td", {
                                              children: (0, d.jsxs)("div", {
                                                className:
                                                  "d-flex align-items-center gap-2",
                                                children: [
                                                  a.productImage
                                                    ? (0, d.jsx)("img", {
                                                        src: a.productImage.startsWith(
                                                          "data:",
                                                        )
                                                          ? a.productImage
                                                          : `${av}/api/productos/${a.productoId}/imagen`,
                                                        alt: a.productName,
                                                        style: {
                                                          width: "40px",
                                                          height: "40px",
                                                          objectFit: "cover",
                                                          borderRadius: "6px",
                                                        },
                                                        onError: (a) => {
                                                          a.target.src =
                                                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                                                        },
                                                      })
                                                    : (0, d.jsx)("div", {
                                                        className:
                                                          "bg-light rounded d-flex align-items-center justify-content-center",
                                                        style: {
                                                          width: "40px",
                                                          height: "40px",
                                                          fontSize: "1.2rem",
                                                        },
                                                        children:
                                                          "\uD83D\uDCE6",
                                                      }),
                                                  (0, d.jsxs)("div", {
                                                    children: [
                                                      (0, d.jsx)("span", {
                                                        className:
                                                          "fw-semibold text-dark d-block",
                                                        children: a.productName,
                                                      }),
                                                      (0, d.jsx)("span", {
                                                        className:
                                                          "text-muted small",
                                                        children: a.productCode,
                                                      }),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                            }),
                                            (0, d.jsx)("td", {
                                              children: (0, d.jsxs)(C.A, {
                                                bg: "success-subtle",
                                                className: "text-success fs-7",
                                                children: [
                                                  "S/ ",
                                                  a.productPrice,
                                                ],
                                              }),
                                            }),
                                            (0, d.jsx)("td", {
                                              children: (0, d.jsxs)("div", {
                                                className:
                                                  "d-flex flex-wrap gap-1 align-items-center",
                                                children: [
                                                  a.intent &&
                                                    (0, d.jsxs)(C.A, {
                                                      bg: "primary-subtle",
                                                      className:
                                                        "text-primary small",
                                                      children: [
                                                        "Intent: ",
                                                        a.intent,
                                                      ],
                                                    }),
                                                  (0, d.jsxs)(C.A, {
                                                    bg: "secondary-subtle",
                                                    className:
                                                      "text-secondary small",
                                                    children: [
                                                      "Prioridad: ",
                                                      a.priority || 100,
                                                    ],
                                                  }),
                                                  a.mediaIdWhatsapp
                                                    ? (0, d.jsx)(C.A, {
                                                        bg: "info-subtle",
                                                        className:
                                                          "text-info small",
                                                        children:
                                                          "Con Imagen (WhatsApp)",
                                                      })
                                                    : (0, d.jsx)(C.A, {
                                                        bg: "light",
                                                        className:
                                                          "text-muted small",
                                                        children:
                                                          "S\xf3lo Texto",
                                                      }),
                                                ],
                                              }),
                                            }),
                                            (0, d.jsx)("td", {
                                              className: "text-center",
                                              children: (0, d.jsxs)("div", {
                                                className:
                                                  "d-flex justify-content-center gap-2",
                                                children: [
                                                  (0, d.jsxs)(A.A, {
                                                    variant: "outline-primary",
                                                    size: "sm",
                                                    onClick: () => {
                                                      (u({
                                                        ...a,
                                                        priority:
                                                          a.priority || 100,
                                                        searchKeywords:
                                                          a.searchKeywords ||
                                                          "",
                                                        customAiDescription:
                                                          a.customAiDescription ||
                                                          "",
                                                        intent: a.intent || "",
                                                        mediaIdWhatsapp:
                                                          a.mediaIdWhatsapp ||
                                                          "",
                                                        imageCaption:
                                                          a.imageCaption || "",
                                                      }),
                                                        F(!0));
                                                    },
                                                    className:
                                                      "d-inline-flex align-items-center gap-1",
                                                    children: [
                                                      (0, d.jsx)(S, {
                                                        size: 16,
                                                      }),
                                                      " Configurar IA",
                                                    ],
                                                  }),
                                                  (0, d.jsxs)(A.A, {
                                                    variant: "outline-success",
                                                    size: "sm",
                                                    onClick: () => {
                                                      (J(a), N(!0));
                                                    },
                                                    className:
                                                      "d-inline-flex align-items-center gap-1",
                                                    children: [
                                                      (0, d.jsx)(M, {
                                                        size: 16,
                                                      }),
                                                      " Previsualizar",
                                                    ],
                                                  }),
                                                ],
                                              }),
                                            }),
                                          ],
                                        },
                                        a.productoId,
                                      ),
                                    ),
                                  }),
                                ],
                              }),
                            }),
                          ],
                        }),
                      }),
                      (0, d.jsx)(w.A, {
                        eventKey: "shipping",
                        title: (0, d.jsxs)("span", {
                          children: [
                            (0, d.jsx)(Y, { size: 18, className: "me-1" }),
                            " Zonas de Env\xedo",
                          ],
                        }),
                        children: (0, d.jsxs)(y.A, {
                          className: "shadow-sm border-0",
                          style: { borderRadius: "12px" },
                          children: [
                            (0, d.jsxs)(y.A.Header, {
                              className:
                                "bg-light border-0 py-3 d-flex justify-content-between align-items-center",
                              children: [
                                (0, d.jsxs)("div", {
                                  children: [
                                    (0, d.jsx)("h5", {
                                      className: "mb-0 fw-bold",
                                      children:
                                        "Zonas de Cobertura de Despacho",
                                    }),
                                    (0, d.jsx)("p", {
                                      className: "text-muted mb-0 small",
                                      children:
                                        "Controla qu\xe9 distritos atiende la IA, costos de despacho y pedidos m\xednimos.",
                                    }),
                                  ],
                                }),
                                (0, d.jsxs)(A.A, {
                                  variant: "primary",
                                  onClick: () => {
                                    (Z(null), ab(!0));
                                  },
                                  children: [
                                    (0, d.jsx)(ai, {
                                      size: 18,
                                      className: "me-1",
                                    }),
                                    "Agregar Zona",
                                  ],
                                }),
                              ],
                            }),
                            (0, d.jsx)(y.A.Body, {
                              className: "p-0",
                              style: { overflowX: "auto" },
                              children: (0, d.jsxs)(B.A, {
                                responsive: !0,
                                hover: !0,
                                className: "mb-0 align-middle",
                                children: [
                                  (0, d.jsx)("thead", {
                                    className: "table-light",
                                    children: (0, d.jsxs)("tr", {
                                      children: [
                                        (0, d.jsx)("th", {
                                          children: "Distrito / Zona",
                                        }),
                                        (0, d.jsx)("th", {
                                          children:
                                            "Alias de B\xfasqueda (Separados por coma)",
                                        }),
                                        (0, d.jsx)("th", {
                                          children:
                                            "Costo de Env\xedo (Delivery)",
                                        }),
                                        (0, d.jsx)("th", {
                                          children: "Compra M\xednima",
                                        }),
                                        (0, d.jsx)("th", {
                                          style: {
                                            width: "150px",
                                            textAlign: "center",
                                          },
                                          children: "Acciones",
                                        }),
                                      ],
                                    }),
                                  }),
                                  (0, d.jsxs)("tbody", {
                                    children: [
                                      P.map((a) =>
                                        (0, d.jsxs)(
                                          "tr",
                                          {
                                            children: [
                                              (0, d.jsx)("td", {
                                                className:
                                                  "fw-semibold text-dark",
                                                children: a.districtName,
                                              }),
                                              (0, d.jsx)("td", {
                                                className: "text-muted small",
                                                children: a.aliases || "-",
                                              }),
                                              (0, d.jsx)("td", {
                                                children:
                                                  0 ===
                                                  parseFloat(a.deliveryFee)
                                                    ? (0, d.jsx)(C.A, {
                                                        bg: "success-subtle",
                                                        className:
                                                          "text-success fw-bold",
                                                        children: "GRATIS",
                                                      })
                                                    : (0, d.jsxs)("span", {
                                                        children: [
                                                          "S/ ",
                                                          a.deliveryFee,
                                                        ],
                                                      }),
                                              }),
                                              (0, d.jsxs)("td", {
                                                children: [
                                                  "S/ ",
                                                  a.minOrderAmount,
                                                ],
                                              }),
                                              (0, d.jsx)("td", {
                                                className: "text-center",
                                                children: (0, d.jsxs)("div", {
                                                  className:
                                                    "d-flex justify-content-center gap-2",
                                                  children: [
                                                    (0, d.jsx)(A.A, {
                                                      variant:
                                                        "outline-primary",
                                                      size: "sm",
                                                      onClick: () => {
                                                        (Z({ ...a }), ab(!0));
                                                      },
                                                      className:
                                                        "btn-icon rounded-circle",
                                                      children: (0, d.jsx)(ak, {
                                                        size: 16,
                                                      }),
                                                    }),
                                                    (0, d.jsx)(A.A, {
                                                      variant: "outline-danger",
                                                      size: "sm",
                                                      onClick: () => aN(a.id),
                                                      className:
                                                        "btn-icon rounded-circle",
                                                      children: (0, d.jsx)(am, {
                                                        size: 16,
                                                      }),
                                                    }),
                                                  ],
                                                }),
                                              }),
                                            ],
                                          },
                                          a.id,
                                        ),
                                      ),
                                      0 === P.length &&
                                        (0, d.jsx)("tr", {
                                          children: (0, d.jsx)("td", {
                                            colSpan: "5",
                                            className:
                                              "text-center text-muted py-4",
                                            children:
                                              "No hay zonas de cobertura registradas. El Agente de IA asumir\xe1 que el despacho es general.",
                                          }),
                                        }),
                                    ],
                                  }),
                                ],
                              }),
                            }),
                          ],
                        }),
                      }),
                      (0, d.jsx)(w.A, {
                        eventKey: "faq",
                        title: (0, d.jsxs)("span", {
                          children: [
                            (0, d.jsx)(aa, { size: 18, className: "me-1" }),
                            " Base de Conocimiento (FAQs)",
                          ],
                        }),
                        children: (0, d.jsxs)(y.A, {
                          className: "shadow-sm border-0",
                          style: { borderRadius: "12px" },
                          children: [
                            (0, d.jsxs)(y.A.Header, {
                              className:
                                "bg-light border-0 py-3 d-flex justify-content-between align-items-center",
                              children: [
                                (0, d.jsxs)("div", {
                                  children: [
                                    (0, d.jsx)("h5", {
                                      className: "mb-0 fw-bold",
                                      children:
                                        "Preguntas Frecuentes y Recursos (PDF, Audios)",
                                    }),
                                    (0, d.jsx)("p", {
                                      className: "text-muted mb-0 small",
                                      children:
                                        "Ense\xf1a al Agente IA c\xf3mo responder a dudas comunes de clientes y as\xf3cialas a recursos multimedia.",
                                    }),
                                  ],
                                }),
                                (0, d.jsxs)(A.A, {
                                  variant: "primary",
                                  onClick: () => {
                                    (an(null), ar(!0));
                                  },
                                  children: [
                                    (0, d.jsx)(ai, {
                                      size: 18,
                                      className: "me-1",
                                    }),
                                    "Agregar Pregunta (FAQ)",
                                  ],
                                }),
                              ],
                            }),
                            (0, d.jsx)(y.A.Body, {
                              className: "p-0",
                              style: { overflowX: "auto" },
                              children: (0, d.jsxs)(B.A, {
                                responsive: !0,
                                hover: !0,
                                className: "mb-0 align-middle",
                                children: [
                                  (0, d.jsx)("thead", {
                                    className: "table-light",
                                    children: (0, d.jsxs)("tr", {
                                      children: [
                                        (0, d.jsx)("th", {
                                          children: "Categor\xeda",
                                        }),
                                        (0, d.jsx)("th", {
                                          children:
                                            "Palabras Clave (Disparadores)",
                                        }),
                                        (0, d.jsx)("th", {
                                          children: "Intenci\xf3n (Intent)",
                                        }),
                                        (0, d.jsx)("th", {
                                          style: { width: "90px" },
                                          children: "Prioridad",
                                        }),
                                        (0, d.jsx)("th", {
                                          children: "Respuesta de la IA",
                                        }),
                                        (0, d.jsx)("th", {
                                          children: "Recurso / Multimedia",
                                        }),
                                        (0, d.jsx)("th", {
                                          style: {
                                            width: "150px",
                                            textAlign: "center",
                                          },
                                          children: "Acciones",
                                        }),
                                      ],
                                    }),
                                  }),
                                  (0, d.jsxs)("tbody", {
                                    children: [
                                      ad.map((a) =>
                                        (0, d.jsxs)(
                                          "tr",
                                          {
                                            children: [
                                              (0, d.jsx)("td", {
                                                children: (0, d.jsx)(C.A, {
                                                  bg: "primary-subtle",
                                                  className:
                                                    "text-primary fw-semibold",
                                                  children: a.category,
                                                }),
                                              }),
                                              (0, d.jsx)("td", {
                                                style: {
                                                  maxWidth: "200px",
                                                  wordBreak: "break-all",
                                                },
                                                children: (0, d.jsx)("span", {
                                                  className: "text-muted small",
                                                  children: a.keywords,
                                                }),
                                              }),
                                              (0, d.jsx)("td", {
                                                children: (0, d.jsx)(C.A, {
                                                  bg: "secondary-subtle",
                                                  className: "text-secondary",
                                                  children: a.intent || "-",
                                                }),
                                              }),
                                              (0, d.jsx)("td", {
                                                children: a.priority || 100,
                                              }),
                                              (0, d.jsx)("td", {
                                                style: {
                                                  minWidth: "250px",
                                                  maxWidth: "350px",
                                                },
                                                children: (0, d.jsx)("p", {
                                                  className:
                                                    "mb-0 small text-dark text-truncate-2",
                                                  style: {
                                                    whiteSpace: "pre-wrap",
                                                    maxHeight: "4.5em",
                                                    overflow: "hidden",
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: "vertical",
                                                  },
                                                  children: a.answer,
                                                }),
                                              }),
                                              (0, d.jsx)("td", {
                                                children: (0, d.jsxs)("div", {
                                                  className:
                                                    "d-flex flex-column gap-1",
                                                  children: [
                                                    "NONE" !==
                                                      a.attachmentType &&
                                                      (0, d.jsxs)(C.A, {
                                                        bg: "info-subtle",
                                                        className:
                                                          "text-info d-inline-flex align-items-center gap-1 w-fit",
                                                        children: [
                                                          "PDF" ===
                                                            a.attachmentType &&
                                                            (0, d.jsx)(ao, {
                                                              size: 12,
                                                            }),
                                                          "IMAGE" ===
                                                            a.attachmentType &&
                                                            (0, d.jsx)(ag, {
                                                              size: 12,
                                                            }),
                                                          "AUDIO" ===
                                                            a.attachmentType &&
                                                            (0, d.jsx)(aq, {
                                                              size: 12,
                                                            }),
                                                          a.attachmentType,
                                                        ],
                                                      }),
                                                    a.mediaIdWhatsapp
                                                      ? (0, d.jsxs)(C.A, {
                                                          bg: "success-subtle",
                                                          className:
                                                            "text-success d-inline-flex align-items-center gap-1 w-fit",
                                                          children: [
                                                            (0, d.jsx)(as, {
                                                              size: 12,
                                                            }),
                                                            " WhatsApp Media",
                                                          ],
                                                        })
                                                      : "NONE" ===
                                                          a.attachmentType &&
                                                        (0, d.jsx)("span", {
                                                          className:
                                                            "text-muted small",
                                                          children:
                                                            "- Ninguno -",
                                                        }),
                                                  ],
                                                }),
                                              }),
                                              (0, d.jsx)("td", {
                                                className: "text-center",
                                                children: (0, d.jsxs)("div", {
                                                  className:
                                                    "d-flex justify-content-center gap-2",
                                                  children: [
                                                    (0, d.jsx)(A.A, {
                                                      variant:
                                                        "outline-primary",
                                                      size: "sm",
                                                      onClick: () => {
                                                        (an({ ...a }), ar(!0));
                                                      },
                                                      className:
                                                        "btn-icon rounded-circle",
                                                      children: (0, d.jsx)(ak, {
                                                        size: 16,
                                                      }),
                                                    }),
                                                    (0, d.jsx)(A.A, {
                                                      variant: "outline-danger",
                                                      size: "sm",
                                                      onClick: () => aP(a.id),
                                                      className:
                                                        "btn-icon rounded-circle",
                                                      children: (0, d.jsx)(am, {
                                                        size: 16,
                                                      }),
                                                    }),
                                                  ],
                                                }),
                                              }),
                                            ],
                                          },
                                          a.id,
                                        ),
                                      ),
                                      0 === ad.length &&
                                        (0, d.jsx)("tr", {
                                          children: (0, d.jsx)("td", {
                                            colSpan: "7",
                                            className:
                                              "text-center text-muted py-4",
                                            children:
                                              "No hay FAQs configuradas. El Agente de IA usar\xe1 el modelo general de respuestas.",
                                          }),
                                        }),
                                    ],
                                  }),
                                ],
                              }),
                            }),
                          ],
                        }),
                      }),
                    ],
                  }),
                  t &&
                    (0, d.jsxs)(D.A, {
                      show: E,
                      onHide: () => F(!1),
                      size: "lg",
                      centered: !0,
                      children: [
                        (0, d.jsx)(D.A.Header, {
                          closeButton: !0,
                          children: (0, d.jsxs)(D.A.Title, {
                            className: "fw-bold fs-5",
                            children: [
                              "\uD83E\uDD16 Configuraci\xf3n de IA para: ",
                              t.productName,
                            ],
                          }),
                        }),
                        (0, d.jsxs)(x.A, {
                          onSubmit: aL,
                          children: [
                            (0, d.jsxs)(D.A.Body, {
                              children: [
                                (0, d.jsxs)(i.A, {
                                  className: "g-3 mb-3",
                                  children: [
                                    (0, d.jsx)(j.A, {
                                      md: 6,
                                      children: (0, d.jsxs)(x.A.Group, {
                                        controlId: "prodIntent",
                                        children: [
                                          (0, d.jsx)(x.A.Label, {
                                            className: "small fw-semibold",
                                            children:
                                              "Intenci\xf3n Asociada (Intent)",
                                          }),
                                          (0, d.jsx)(x.A.Control, {
                                            type: "text",
                                            value: t.intent,
                                            onChange: (a) =>
                                              u({
                                                ...t,
                                                intent: a.target.value,
                                              }),
                                            placeholder:
                                              "Ej: promocion, catalogo, agua_alcalina",
                                          }),
                                          (0, d.jsx)(x.A.Text, {
                                            className: "text-muted small",
                                            children:
                                              "Ayuda al chatbot a identificar si este producto coincide con un intent espec\xedfico.",
                                          }),
                                        ],
                                      }),
                                    }),
                                    (0, d.jsx)(j.A, {
                                      md: 6,
                                      children: (0, d.jsxs)(x.A.Group, {
                                        controlId: "prodPriority",
                                        children: [
                                          (0, d.jsx)(x.A.Label, {
                                            className: "small fw-semibold",
                                            children: "Prioridad de Despliegue",
                                          }),
                                          (0, d.jsx)(x.A.Control, {
                                            type: "number",
                                            value: t.priority,
                                            onChange: (a) =>
                                              u({
                                                ...t,
                                                priority:
                                                  parseInt(a.target.value) ||
                                                  100,
                                              }),
                                            required: !0,
                                          }),
                                          (0, d.jsx)(x.A.Text, {
                                            className: "text-muted small",
                                            children:
                                              "Menor valor indica mayor prioridad (ej: 1 se muestra antes que 100).",
                                          }),
                                        ],
                                      }),
                                    }),
                                  ],
                                }),
                                (0, d.jsxs)(x.A.Group, {
                                  className: "mb-3",
                                  controlId: "prodKeywords",
                                  children: [
                                    (0, d.jsx)(x.A.Label, {
                                      className: "small fw-semibold",
                                      children:
                                        "Palabras Clave (Separadas por comas)",
                                    }),
                                    (0, d.jsx)(x.A.Control, {
                                      type: "text",
                                      value: t.searchKeywords,
                                      onChange: (a) =>
                                        u({
                                          ...t,
                                          searchKeywords: a.target.value,
                                        }),
                                      placeholder:
                                        "Ej: bidon, recarga, 20 litros, agua alcalina",
                                    }),
                                    (0, d.jsx)(x.A.Text, {
                                      className: "text-muted small",
                                      children:
                                        "Sin\xf3nimos que el cliente podr\xeda usar para buscar este producto.",
                                    }),
                                  ],
                                }),
                                (0, d.jsxs)(x.A.Group, {
                                  className: "mb-3",
                                  controlId: "prodCustomDesc",
                                  children: [
                                    (0, d.jsx)(x.A.Label, {
                                      className: "small fw-semibold",
                                      children:
                                        "Descripci\xf3n del Producto para la IA",
                                    }),
                                    (0, d.jsx)(x.A.Control, {
                                      as: "textarea",
                                      rows: 3,
                                      value: t.customAiDescription,
                                      onChange: (a) =>
                                        u({
                                          ...t,
                                          customAiDescription: a.target.value,
                                        }),
                                      placeholder:
                                        "Escribe detalles espec\xedficos que la IA deba conocer al vender este producto (ej. PH exacto, beneficios, promociones incluidas)...",
                                    }),
                                  ],
                                }),
                                (0, d.jsx)("hr", {}),
                                (0, d.jsx)("h6", {
                                  className: "fw-bold mb-3 text-secondary",
                                  children:
                                    "\uD83D\uDD17 Recursos Multimedia de WhatsApp Cloud API",
                                }),
                                (0, d.jsxs)(i.A, {
                                  className: "g-3",
                                  children: [
                                    (0, d.jsx)(j.A, {
                                      md: 6,
                                      children: (0, d.jsxs)(x.A.Group, {
                                        controlId: "prodMediaId",
                                        children: [
                                          (0, d.jsx)(x.A.Label, {
                                            className: "small fw-semibold",
                                            children:
                                              "WhatsApp Media ID (Imagen / Archivo)",
                                          }),
                                          (0, d.jsx)(x.A.Control, {
                                            type: "text",
                                            value: t.mediaIdWhatsapp,
                                            onChange: (a) =>
                                              u({
                                                ...t,
                                                mediaIdWhatsapp: a.target.value,
                                              }),
                                            placeholder: "Ej: 1234567890123456",
                                          }),
                                          (0, d.jsx)(x.A.Text, {
                                            className: "text-muted small",
                                            children:
                                              "ID de la imagen subida a la API de WhatsApp para env\xedo de alta velocidad.",
                                          }),
                                        ],
                                      }),
                                    }),
                                    (0, d.jsx)(j.A, {
                                      md: 6,
                                      children: (0, d.jsxs)(x.A.Group, {
                                        controlId: "prodCaption",
                                        children: [
                                          (0, d.jsx)(x.A.Label, {
                                            className: "small fw-semibold",
                                            children: "Pie de Foto (Caption)",
                                          }),
                                          (0, d.jsx)(x.A.Control, {
                                            type: "text",
                                            value: t.imageCaption,
                                            onChange: (a) =>
                                              u({
                                                ...t,
                                                imageCaption: a.target.value,
                                              }),
                                            placeholder:
                                              "Ej: Bid\xf3n de 20L - S/ 15.00",
                                          }),
                                          (0, d.jsx)(x.A.Text, {
                                            className: "text-muted small",
                                            children:
                                              "Texto descriptivo que acompa\xf1a a la imagen enviada.",
                                          }),
                                        ],
                                      }),
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            (0, d.jsxs)(D.A.Footer, {
                              children: [
                                (0, d.jsx)(A.A, {
                                  variant: "secondary",
                                  onClick: () => F(!1),
                                  children: "Cancelar",
                                }),
                                (0, d.jsxs)(A.A, {
                                  variant: "success",
                                  type: "submit",
                                  disabled: ay,
                                  children: [
                                    ay
                                      ? (0, d.jsx)(h.A, {
                                          size: "sm",
                                          className: "me-2",
                                        })
                                      : (0, d.jsx)(O, {
                                          size: 18,
                                          className: "me-2",
                                        }),
                                    "Guardar Cambios",
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  H &&
                    (0, d.jsxs)(D.A, {
                      show: L,
                      onHide: () => N(!1),
                      centered: !0,
                      size: "md",
                      children: [
                        (0, d.jsx)(D.A.Header, {
                          closeButton: !0,
                          className: "p-3 border-0 bg-success text-white",
                          style: { background: "#075e54" },
                          children: (0, d.jsxs)("div", {
                            className: "d-flex align-items-center gap-2",
                            children: [
                              (0, d.jsx)("div", {
                                className:
                                  "bg-white rounded-circle d-flex align-items-center justify-content-center",
                                style: {
                                  width: "38px",
                                  height: "38px",
                                  fontSize: "1.2rem",
                                },
                                children: "\uD83E\uDD16",
                              }),
                              (0, d.jsxs)("div", {
                                children: [
                                  (0, d.jsx)("h6", {
                                    className: "mb-0 text-white fw-bold",
                                    children: m["ai.agent.name"] || "Asesor IA",
                                  }),
                                  (0, d.jsx)("span", {
                                    className: "text-white-50 small",
                                    children: "en l\xednea",
                                  }),
                                ],
                              }),
                            ],
                          }),
                        }),
                        (0, d.jsx)(D.A.Body, {
                          className: "p-3",
                          style: {
                            background: "#efeae2",
                            backgroundImage:
                              "radial-gradient(#dfdcd6 10%, transparent 11%)",
                            backgroundSize: "15px 15px",
                            minHeight: "380px",
                          },
                          children: (0, d.jsx)("div", {
                            className: "d-flex flex-column gap-3 mb-2",
                            children:
                              H.productImage || H.mediaIdWhatsapp
                                ? (0, d.jsxs)("div", {
                                    className:
                                      "align-self-start bg-white p-1 shadow-sm rounded-3",
                                    style: {
                                      maxWidth: "85%",
                                      minWidth: "220px",
                                      borderRadius: "7px",
                                    },
                                    children: [
                                      (0, d.jsxs)("div", {
                                        className:
                                          "position-relative overflow-hidden rounded-2 mb-1",
                                        style: {
                                          maxHeight: "200px",
                                          backgroundColor: "#e9ecef",
                                          display: "flex",
                                          justifyContent: "center",
                                        },
                                        children: [
                                          (0, d.jsx)("img", {
                                            src:
                                              H.productImage &&
                                              (H.productImage.startsWith(
                                                "data:",
                                              ) ||
                                                H.productImage.startsWith(
                                                  "http",
                                                ))
                                                ? H.productImage
                                                : `${av}/api/productos/${H.productoId}/imagen`,
                                            alt: H.productName,
                                            style: {
                                              width: "100%",
                                              height: "auto",
                                              objectFit: "contain",
                                              maxHeight: "200px",
                                            },
                                            onError: (a) => {
                                              a.target.src =
                                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                                            },
                                          }),
                                          (0, d.jsx)("div", {
                                            className:
                                              "position-absolute top-0 start-0 m-2",
                                            children: H.mediaIdWhatsapp
                                              ? (0, d.jsxs)(C.A, {
                                                  bg: "success",
                                                  className: "shadow-sm",
                                                  children: [
                                                    "Media ID: ",
                                                    H.mediaIdWhatsapp,
                                                  ],
                                                })
                                              : (0, d.jsx)(C.A, {
                                                  bg: "warning",
                                                  className:
                                                    "shadow-sm text-dark",
                                                  children:
                                                    "Foto del Cat\xe1logo",
                                                }),
                                          }),
                                        ],
                                      }),
                                      (0, d.jsxs)("div", {
                                        className:
                                          "px-2 py-1 position-relative",
                                        children: [
                                          (0, d.jsx)("div", {
                                            className: "text-dark me-5",
                                            style: {
                                              fontSize: "0.9rem",
                                              wordBreak: "break-word",
                                              whiteSpace: "pre-wrap",
                                            },
                                            children: aH(
                                              H.imageCaption ||
                                                `*${H.productName}*
💵 *Precio:* S/ ${H.productPrice}

${H.customAiDescription || ""}`,
                                            ),
                                          }),
                                          (0, d.jsxs)("div", {
                                            className:
                                              "text-muted d-flex align-items-center justify-content-end gap-1 position-absolute bottom-0 end-0 pe-2 pb-1",
                                            style: { fontSize: "0.7rem" },
                                            children: [
                                              (0, d.jsx)("span", {
                                                children: "12:00",
                                              }),
                                              (0, d.jsx)("span", {
                                                style: { color: "#53bdeb" },
                                                children: "✔✔",
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  })
                                : (0, d.jsxs)("div", {
                                    className:
                                      "align-self-start bg-white px-3 py-2 shadow-sm rounded-3 position-relative",
                                    style: {
                                      maxWidth: "85%",
                                      minWidth: "180px",
                                      borderRadius: "7px",
                                    },
                                    children: [
                                      (0, d.jsx)("div", {
                                        className: "text-dark mb-2 me-4",
                                        style: {
                                          fontSize: "0.9rem",
                                          wordBreak: "break-word",
                                          whiteSpace: "pre-wrap",
                                        },
                                        children: aH(`*${H.productName}*
💵 *Precio:* S/ ${H.productPrice}

${H.customAiDescription || "_Sin descripci\xf3n personalizada de IA._"}

🚚 *Delivery:* \xa1Gratis en zonas de cobertura!`),
                                      }),
                                      (0, d.jsxs)("div", {
                                        className:
                                          "text-muted d-flex align-items-center justify-content-end gap-1 position-absolute bottom-0 end-0 pe-2 pb-1",
                                        style: { fontSize: "0.7rem" },
                                        children: [
                                          (0, d.jsx)("span", {
                                            children: "12:00",
                                          }),
                                          (0, d.jsx)("span", {
                                            style: { color: "#53bdeb" },
                                            children: "✔✔",
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                          }),
                        }),
                        (0, d.jsxs)(D.A.Footer, {
                          className:
                            "p-2 bg-light d-flex align-items-center gap-2 border-0",
                          children: [
                            (0, d.jsx)(z.A, {
                              className:
                                "rounded-pill shadow-sm overflow-hidden",
                              style: { flex: 1, backgroundColor: "white" },
                              children: (0, d.jsx)(x.A.Control, {
                                type: "text",
                                placeholder: "Escribe un mensaje...",
                                disabled: !0,
                                className: "border-0 px-3 bg-white",
                                style: { fontSize: "0.85rem" },
                              }),
                            }),
                            (0, d.jsx)(A.A, {
                              variant: "success",
                              className:
                                "rounded-circle d-flex align-items-center justify-content-center",
                              style: {
                                width: "40px",
                                height: "40px",
                                backgroundColor: "#00a884",
                                borderColor: "#00a884",
                              },
                              onClick: () => N(!1),
                              children: (0, d.jsx)(au, {
                                size: 20,
                                className: "text-white",
                              }),
                            }),
                          ],
                        }),
                      ],
                    }),
                  (0, d.jsxs)(D.A, {
                    show: _,
                    onHide: () => {
                      (ab(!1), Z(null));
                    },
                    centered: !0,
                    children: [
                      (0, d.jsx)(D.A.Header, {
                        closeButton: !0,
                        children: (0, d.jsx)(D.A.Title, {
                          className: "fw-bold fs-5",
                          children: X
                            ? "Editar Zona de Cobertura"
                            : "Agregar Zona de Cobertura",
                        }),
                      }),
                      (0, d.jsxs)(x.A, {
                        onSubmit: aM,
                        children: [
                          (0, d.jsxs)(D.A.Body, {
                            children: [
                              (0, d.jsxs)(x.A.Group, {
                                className: "mb-3",
                                controlId: "covName",
                                children: [
                                  (0, d.jsx)(x.A.Label, {
                                    className: "small fw-semibold",
                                    children: "Nombre del Distrito / Zona",
                                  }),
                                  (0, d.jsx)(x.A.Control, {
                                    type: "text",
                                    value: X ? X.districtName : T.districtName,
                                    onChange: (a) => {
                                      X
                                        ? Z({
                                            ...X,
                                            districtName: a.target.value,
                                          })
                                        : V({
                                            ...T,
                                            districtName: a.target.value,
                                          });
                                    },
                                    placeholder: "Ej: La Molina",
                                    required: !0,
                                  }),
                                ],
                              }),
                              (0, d.jsxs)(x.A.Group, {
                                className: "mb-3",
                                controlId: "covFee",
                                children: [
                                  (0, d.jsx)(x.A.Label, {
                                    className: "small fw-semibold",
                                    children: "Costo de Env\xedo (S/)",
                                  }),
                                  (0, d.jsx)(x.A.Control, {
                                    type: "number",
                                    step: "0.10",
                                    value: X ? X.deliveryFee : T.deliveryFee,
                                    onChange: (a) => {
                                      X
                                        ? Z({
                                            ...X,
                                            deliveryFee:
                                              parseFloat(a.target.value) || 0,
                                          })
                                        : V({
                                            ...T,
                                            deliveryFee:
                                              parseFloat(a.target.value) || 0,
                                          });
                                    },
                                    required: !0,
                                  }),
                                ],
                              }),
                              (0, d.jsxs)(x.A.Group, {
                                className: "mb-3",
                                controlId: "covMin",
                                children: [
                                  (0, d.jsx)(x.A.Label, {
                                    className: "small fw-semibold",
                                    children: "Monto M\xednimo de Pedido (S/)",
                                  }),
                                  (0, d.jsx)(x.A.Control, {
                                    type: "number",
                                    step: "1.00",
                                    value: X
                                      ? X.minOrderAmount
                                      : T.minOrderAmount,
                                    onChange: (a) => {
                                      X
                                        ? Z({
                                            ...X,
                                            minOrderAmount:
                                              parseFloat(a.target.value) || 0,
                                          })
                                        : V({
                                            ...T,
                                            minOrderAmount:
                                              parseFloat(a.target.value) || 0,
                                          });
                                    },
                                    required: !0,
                                  }),
                                ],
                              }),
                              (0, d.jsxs)(x.A.Group, {
                                className: "mb-3",
                                controlId: "covAliases",
                                children: [
                                  (0, d.jsx)(x.A.Label, {
                                    className: "small fw-semibold",
                                    children:
                                      "Alias de Distrito (Separados por coma para b\xfasqueda IA)",
                                  }),
                                  (0, d.jsx)(x.A.Control, {
                                    type: "text",
                                    value: X
                                      ? X.aliases || ""
                                      : T.aliases || "",
                                    onChange: (a) => {
                                      X
                                        ? Z({ ...X, aliases: a.target.value })
                                        : V({ ...T, aliases: a.target.value });
                                    },
                                    placeholder:
                                      "Ej: molina, la molina, molinero",
                                  }),
                                ],
                              }),
                            ],
                          }),
                          (0, d.jsxs)(D.A.Footer, {
                            children: [
                              (0, d.jsx)(A.A, {
                                variant: "secondary",
                                onClick: () => {
                                  (ab(!1), Z(null));
                                },
                                children: "Cancelar",
                              }),
                              (0, d.jsx)(A.A, {
                                variant: "success",
                                type: "submit",
                                children: X
                                  ? "Guardar Cambios"
                                  : "Agregar Zona",
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, d.jsxs)(D.A, {
                    show: ap,
                    onHide: () => {
                      (ar(!1), an(null));
                    },
                    size: "lg",
                    centered: !0,
                    children: [
                      (0, d.jsx)(D.A.Header, {
                        closeButton: !0,
                        children: (0, d.jsx)(D.A.Title, {
                          className: "fw-bold fs-5",
                          children: al
                            ? "Editar Pregunta Frecuente (FAQ)"
                            : "Agregar Pregunta Frecuente (FAQ)",
                        }),
                      }),
                      (0, d.jsxs)(x.A, {
                        onSubmit: aO,
                        children: [
                          (0, d.jsxs)(D.A.Body, {
                            children: [
                              (0, d.jsxs)(i.A, {
                                className: "g-3",
                                children: [
                                  (0, d.jsx)(j.A, {
                                    md: 6,
                                    children: (0, d.jsxs)(x.A.Group, {
                                      className: "mb-3",
                                      controlId: "faqCat",
                                      children: [
                                        (0, d.jsx)(x.A.Label, {
                                          className: "small fw-semibold",
                                          children: "Categor\xeda",
                                        }),
                                        (0, d.jsx)(x.A.Control, {
                                          type: "text",
                                          value: al ? al.category : ah.category,
                                          onChange: (a) => {
                                            al
                                              ? an({
                                                  ...al,
                                                  category: a.target.value,
                                                })
                                              : aj({
                                                  ...ah,
                                                  category: a.target.value,
                                                });
                                          },
                                          placeholder: "Ej: M\xe9todos de Pago",
                                          required: !0,
                                        }),
                                      ],
                                    }),
                                  }),
                                  (0, d.jsx)(j.A, {
                                    md: 6,
                                    children: (0, d.jsxs)(x.A.Group, {
                                      className: "mb-3",
                                      controlId: "faqKws",
                                      children: [
                                        (0, d.jsx)(x.A.Label, {
                                          className: "small fw-semibold",
                                          children:
                                            "Palabras Clave (Separadas por comas)",
                                        }),
                                        (0, d.jsx)(x.A.Control, {
                                          type: "text",
                                          value: al ? al.keywords : ah.keywords,
                                          onChange: (a) => {
                                            al
                                              ? an({
                                                  ...al,
                                                  keywords: a.target.value,
                                                })
                                              : aj({
                                                  ...ah,
                                                  keywords: a.target.value,
                                                });
                                          },
                                          placeholder:
                                            "Ej: yape, plin, transferencia, pagar, efectivo",
                                          required: !0,
                                        }),
                                      ],
                                    }),
                                  }),
                                ],
                              }),
                              (0, d.jsxs)(x.A.Group, {
                                className: "mb-3",
                                controlId: "faqAns",
                                children: [
                                  (0, d.jsx)(x.A.Label, {
                                    className: "small fw-semibold",
                                    children: "Respuesta de la IA",
                                  }),
                                  (0, d.jsx)(x.A.Control, {
                                    as: "textarea",
                                    rows: 4,
                                    value: al ? al.answer : ah.answer,
                                    onChange: (a) => {
                                      al
                                        ? an({ ...al, answer: a.target.value })
                                        : aj({ ...ah, answer: a.target.value });
                                    },
                                    placeholder:
                                      "Escribe la respuesta exacta que debe dar la IA cuando se mencionen las palabras clave...",
                                    required: !0,
                                  }),
                                ],
                              }),
                              (0, d.jsxs)(i.A, {
                                className: "g-3 mb-3",
                                children: [
                                  (0, d.jsx)(j.A, {
                                    md: 6,
                                    children: (0, d.jsxs)(x.A.Group, {
                                      controlId: "faqIntent",
                                      children: [
                                        (0, d.jsx)(x.A.Label, {
                                          className: "small fw-semibold",
                                          children: "Intenci\xf3n (Intent)",
                                        }),
                                        (0, d.jsx)(x.A.Control, {
                                          type: "text",
                                          value: al
                                            ? al.intent || ""
                                            : ah.intent || "",
                                          onChange: (a) => {
                                            al
                                              ? an({
                                                  ...al,
                                                  intent: a.target.value,
                                                })
                                              : aj({
                                                  ...ah,
                                                  intent: a.target.value,
                                                });
                                          },
                                          placeholder:
                                            "Ej: promocion, delivery",
                                        }),
                                      ],
                                    }),
                                  }),
                                  (0, d.jsx)(j.A, {
                                    md: 6,
                                    children: (0, d.jsxs)(x.A.Group, {
                                      controlId: "faqPriority",
                                      children: [
                                        (0, d.jsx)(x.A.Label, {
                                          className: "small fw-semibold",
                                          children: "Prioridad",
                                        }),
                                        (0, d.jsx)(x.A.Control, {
                                          type: "number",
                                          value: al
                                            ? al.priority || 100
                                            : ah.priority || 100,
                                          onChange: (a) => {
                                            let b =
                                              parseInt(a.target.value) || 100;
                                            al
                                              ? an({ ...al, priority: b })
                                              : aj({ ...ah, priority: b });
                                          },
                                        }),
                                      ],
                                    }),
                                  }),
                                ],
                              }),
                              (0, d.jsxs)(i.A, {
                                className: "g-3 mb-3",
                                children: [
                                  (0, d.jsx)(j.A, {
                                    md: 6,
                                    children: (0, d.jsxs)(x.A.Group, {
                                      controlId: "faqMediaId",
                                      children: [
                                        (0, d.jsx)(x.A.Label, {
                                          className: "small fw-semibold",
                                          children:
                                            "Media ID (WhatsApp Cloud API)",
                                        }),
                                        (0, d.jsx)(x.A.Control, {
                                          type: "text",
                                          value: al
                                            ? al.mediaIdWhatsapp || ""
                                            : ah.mediaIdWhatsapp || "",
                                          onChange: (a) => {
                                            al
                                              ? an({
                                                  ...al,
                                                  mediaIdWhatsapp:
                                                    a.target.value,
                                                })
                                              : aj({
                                                  ...ah,
                                                  mediaIdWhatsapp:
                                                    a.target.value,
                                                });
                                          },
                                          placeholder:
                                            "ID de multimedia en Meta...",
                                        }),
                                      ],
                                    }),
                                  }),
                                  (0, d.jsx)(j.A, {
                                    md: 6,
                                    children: (0, d.jsxs)(x.A.Group, {
                                      controlId: "faqMediaCaption",
                                      children: [
                                        (0, d.jsx)(x.A.Label, {
                                          className: "small fw-semibold",
                                          children:
                                            "Subt\xedtulo del Media (Caption)",
                                        }),
                                        (0, d.jsx)(x.A.Control, {
                                          type: "text",
                                          value: al
                                            ? al.mediaCaption || ""
                                            : ah.mediaCaption || "",
                                          onChange: (a) => {
                                            al
                                              ? an({
                                                  ...al,
                                                  mediaCaption: a.target.value,
                                                })
                                              : aj({
                                                  ...ah,
                                                  mediaCaption: a.target.value,
                                                });
                                          },
                                          placeholder:
                                            "Subt\xedtulo que acompa\xf1ar\xe1 a la imagen...",
                                        }),
                                      ],
                                    }),
                                  }),
                                ],
                              }),
                              (0, d.jsxs)(i.A, {
                                className: "g-3",
                                children: [
                                  (0, d.jsx)(j.A, {
                                    md: 4,
                                    children: (0, d.jsxs)(x.A.Group, {
                                      className: "mb-3",
                                      controlId: "faqAttachType",
                                      children: [
                                        (0, d.jsx)(x.A.Label, {
                                          className: "small fw-semibold",
                                          children:
                                            "Tipo de Recurso Adjunto (Legacy)",
                                        }),
                                        (0, d.jsxs)(x.A.Select, {
                                          value: al
                                            ? al.attachmentType
                                            : ah.attachmentType,
                                          onChange: (a) => {
                                            al
                                              ? an({
                                                  ...al,
                                                  attachmentType:
                                                    a.target.value,
                                                })
                                              : aj({
                                                  ...ah,
                                                  attachmentType:
                                                    a.target.value,
                                                });
                                          },
                                          children: [
                                            (0, d.jsx)("option", {
                                              value: "NONE",
                                              children: "Ninguno",
                                            }),
                                            (0, d.jsx)("option", {
                                              value: "IMAGE",
                                              children: "Imagen",
                                            }),
                                            (0, d.jsx)("option", {
                                              value: "PDF",
                                              children: "Documento PDF",
                                            }),
                                            (0, d.jsx)("option", {
                                              value: "AUDIO",
                                              children:
                                                "Mensaje de Voz (Audio)",
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  }),
                                  (0, d.jsx)(j.A, {
                                    md: 8,
                                    children: (0, d.jsxs)(x.A.Group, {
                                      className: "mb-3",
                                      controlId: "faqAttachUrl",
                                      children: [
                                        (0, d.jsx)(x.A.Label, {
                                          className: "small fw-semibold",
                                          children:
                                            "URL del Archivo / Enlace de descarga (Legacy)",
                                        }),
                                        (0, d.jsx)(x.A.Control, {
                                          type: "text",
                                          value: al
                                            ? al.attachmentUrl || ""
                                            : ah.attachmentUrl || "",
                                          onChange: (a) => {
                                            al
                                              ? an({
                                                  ...al,
                                                  attachmentUrl: a.target.value,
                                                })
                                              : aj({
                                                  ...ah,
                                                  attachmentUrl: a.target.value,
                                                });
                                          },
                                          placeholder:
                                            "Ej: http://localhost:8080/uploads/catalogo.pdf",
                                          disabled: al
                                            ? "NONE" === al.attachmentType
                                            : "NONE" === ah.attachmentType,
                                        }),
                                      ],
                                    }),
                                  }),
                                ],
                              }),
                            ],
                          }),
                          (0, d.jsxs)(D.A.Footer, {
                            children: [
                              (0, d.jsx)(A.A, {
                                variant: "secondary",
                                onClick: () => {
                                  (ar(!1), an(null));
                                },
                                children: "Cancelar",
                              }),
                              (0, d.jsx)(A.A, {
                                variant: "success",
                                type: "submit",
                                children: al
                                  ? "Guardar Cambios"
                                  : "Agregar FAQ",
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              });
        }
      },
      77783: (a, b, c) => {
        "use strict";
        c.d(b, { A: () => s });
        var d = c(68813),
          e = c.n(d),
          f = c(38301),
          g = c(43738),
          h = c(74678),
          i = c(67971),
          j = c(90565),
          k = c(21124);
        let l = (0, j.A)("h4");
        l.displayName = "DivStyledAsH4";
        let m = f.forwardRef(
          ({ className: a, bsPrefix: b, as: c = l, ...d }, f) => (
            (b = (0, i.oU)(b, "alert-heading")),
            (0, k.jsx)(c, { ref: f, className: e()(a, b), ...d })
          ),
        );
        m.displayName = "AlertHeading";
        var n = c(49167);
        let o = f.forwardRef(
          ({ className: a, bsPrefix: b, as: c = n.Ay, ...d }, f) => (
            (b = (0, i.oU)(b, "alert-link")),
            (0, k.jsx)(c, { ref: f, className: e()(a, b), ...d })
          ),
        );
        o.displayName = "AlertLink";
        var p = c(97141),
          q = c(93335);
        let r = f.forwardRef((a, b) => {
          let {
              bsPrefix: c,
              show: d = !0,
              closeLabel: f = "Close alert",
              closeVariant: j,
              className: l,
              children: m,
              variant: n = "primary",
              onClose: o,
              dismissible: r,
              transition: s = p.A,
              ...t
            } = (0, g.Zw)(a, { show: "onClose" }),
            u = (0, i.oU)(c, "alert"),
            v = (0, h.A)((a) => {
              o && o(!1, a);
            }),
            w = !0 === s ? p.A : s,
            x = (0, k.jsxs)("div", {
              role: "alert",
              ...(!w ? t : void 0),
              ref: b,
              className: e()(l, u, n && `${u}-${n}`, r && `${u}-dismissible`),
              children: [
                r &&
                  (0, k.jsx)(q.A, { onClick: v, "aria-label": f, variant: j }),
                m,
              ],
            });
          return w
            ? (0, k.jsx)(w, {
                unmountOnExit: !0,
                ...t,
                ref: void 0,
                in: d,
                children: x,
              })
            : d
              ? x
              : null;
        });
        r.displayName = "Alert";
        let s = Object.assign(r, { Link: o, Heading: m });
      },
      78221: (a, b, c) => {
        "use strict";
        ((b.__esModule = !0), (b.default = void 0), (b.useTabPanel = p));
        var d = n(c(38301)),
          e = l(c(85988)),
          f = n(c(30447)),
          g = l(c(69213)),
          h = c(21124);
        let i = [
            "active",
            "eventKey",
            "mountOnEnter",
            "transition",
            "unmountOnExit",
            "role",
            "onEnter",
            "onEntering",
            "onEntered",
            "onExit",
            "onExiting",
            "onExited",
          ],
          j = ["activeKey", "getControlledId", "getControllerId"],
          k = ["as"];
        function l(a) {
          return a && a.__esModule ? a : { default: a };
        }
        function m(a) {
          if ("function" != typeof WeakMap) return null;
          var b = new WeakMap(),
            c = new WeakMap();
          return (m = function (a) {
            return a ? c : b;
          })(a);
        }
        function n(a, b) {
          if (!b && a && a.__esModule) return a;
          if (null === a || ("object" != typeof a && "function" != typeof a))
            return { default: a };
          var c = m(b);
          if (c && c.has(a)) return c.get(a);
          var d = { __proto__: null },
            e = Object.defineProperty && Object.getOwnPropertyDescriptor;
          for (var f in a)
            if ("default" !== f && {}.hasOwnProperty.call(a, f)) {
              var g = e ? Object.getOwnPropertyDescriptor(a, f) : null;
              g && (g.get || g.set)
                ? Object.defineProperty(d, f, g)
                : (d[f] = a[f]);
            }
          return ((d.default = a), c && c.set(a, d), d);
        }
        function o(a, b) {
          if (null == a) return {};
          var c = {};
          for (var d in a)
            if ({}.hasOwnProperty.call(a, d)) {
              if (b.indexOf(d) >= 0) continue;
              c[d] = a[d];
            }
          return c;
        }
        function p(a) {
          let {
              active: b,
              eventKey: c,
              mountOnEnter: g,
              transition: h,
              unmountOnExit: k,
              role: l = "tabpanel",
              onEnter: m,
              onEntering: n,
              onEntered: p,
              onExit: q,
              onExiting: r,
              onExited: s,
            } = a,
            t = o(a, i),
            u = (0, d.useContext)(e.default);
          if (!u)
            return [
              Object.assign({}, t, { role: l }),
              {
                eventKey: c,
                isActive: b,
                mountOnEnter: g,
                transition: h,
                unmountOnExit: k,
                onEnter: m,
                onEntering: n,
                onEntered: p,
                onExit: q,
                onExiting: r,
                onExited: s,
              },
            ];
          let { activeKey: v, getControlledId: w, getControllerId: x } = u,
            y = o(u, j),
            z = (0, f.makeEventKey)(c);
          return [
            Object.assign({}, t, {
              role: l,
              id: w(c),
              "aria-labelledby": x(c),
            }),
            {
              eventKey: c,
              isActive:
                null == b && null != z ? (0, f.makeEventKey)(v) === z : b,
              transition: h || y.transition,
              mountOnEnter: null != g ? g : y.mountOnEnter,
              unmountOnExit: null != k ? k : y.unmountOnExit,
              onEnter: m,
              onEntering: n,
              onEntered: p,
              onExit: q,
              onExiting: r,
              onExited: s,
            },
          ];
        }
        let q = d.forwardRef((a, b) => {
          let { as: c = "div" } = a,
            [
              d,
              {
                isActive: i,
                onEnter: j,
                onEntering: l,
                onEntered: m,
                onExit: n,
                onExiting: q,
                onExited: r,
                mountOnEnter: s,
                unmountOnExit: t,
                transition: u = g.default,
              },
            ] = p(o(a, k));
          return (0, h.jsx)(e.default.Provider, {
            value: null,
            children: (0, h.jsx)(f.default.Provider, {
              value: null,
              children: (0, h.jsx)(u, {
                in: i,
                onEnter: j,
                onEntering: l,
                onEntered: m,
                onExit: n,
                onExiting: q,
                onExited: r,
                mountOnEnter: s,
                unmountOnExit: t,
                children: (0, h.jsx)(
                  c,
                  Object.assign({}, d, {
                    ref: b,
                    hidden: !i,
                    "aria-hidden": !i,
                  }),
                ),
              }),
            }),
          });
        });
        ((q.displayName = "TabPanel"), (b.default = q));
      },
      86439: (a) => {
        "use strict";
        a.exports = require("next/dist/shared/lib/no-fallback-error.external");
      },
      87936: (a, b, c) => {
        "use strict";
        (c.r(b),
          c.d(b, {
            GlobalError: () => D.a,
            __next_app__: () => J,
            handler: () => L,
            pages: () => I,
            routeModule: () => K,
            tree: () => H,
          }));
        var d = c(49754),
          e = c(9117),
          f = c(46595),
          g = c(32324),
          h = c(39326),
          i = c(38928),
          j = c(20175),
          k = c(12),
          l = c(54290),
          m = c(12696),
          n = c(82802),
          o = c(77533),
          p = c(45229),
          q = c(32822),
          r = c(261),
          s = c(26453),
          t = c(52474),
          u = c(26713),
          v = c(51356),
          w = c(62685),
          x = c(36225),
          y = c(63446),
          z = c(2762),
          A = c(45742),
          B = c(86439),
          C = c(81170),
          D = c.n(C),
          E = c(62506),
          F = c(91203),
          G = {};
        for (let a in E)
          0 >
            [
              "default",
              "tree",
              "pages",
              "GlobalError",
              "__next_app__",
              "routeModule",
              "handler",
            ].indexOf(a) && (G[a] = () => E[a]);
        c.d(b, G);
        let H = {
            children: [
              "",
              {
                children: [
                  "(apps layout)",
                  {
                    children: [
                      "admin",
                      {
                        children: [
                          "config",
                          {
                            children: [
                              "__PAGE__",
                              {},
                              {
                                page: [
                                  () =>
                                    Promise.resolve().then(c.bind(c, 70520)),
                                  "/app/src/app/(apps layout)/admin/config/page.jsx",
                                ],
                              },
                            ],
                          },
                          {},
                        ],
                      },
                      {},
                    ],
                  },
                  {
                    layout: [
                      () => Promise.resolve().then(c.bind(c, 568)),
                      "/app/src/app/(apps layout)/layout.jsx",
                    ],
                    loading: [
                      () => Promise.resolve().then(c.bind(c, 57472)),
                      "/app/src/app/(apps layout)/loading.jsx",
                    ],
                    forbidden: [
                      () => Promise.resolve().then(c.t.bind(c, 90461, 23)),
                      "next/dist/client/components/builtin/forbidden.js",
                    ],
                    unauthorized: [
                      () => Promise.resolve().then(c.t.bind(c, 32768, 23)),
                      "next/dist/client/components/builtin/unauthorized.js",
                    ],
                    metadata: {
                      icon: [
                        async (a) =>
                          (
                            await Promise.resolve().then(c.bind(c, 78162))
                          ).default(a),
                      ],
                      apple: [],
                      openGraph: [],
                      twitter: [],
                      manifest: void 0,
                    },
                  },
                ],
              },
              {
                layout: [
                  () => Promise.resolve().then(c.bind(c, 97634)),
                  "/app/src/app/layout.js",
                ],
                "global-error": [
                  () => Promise.resolve().then(c.t.bind(c, 81170, 23)),
                  "next/dist/client/components/builtin/global-error.js",
                ],
                "not-found": [
                  () => Promise.resolve().then(c.bind(c, 96170)),
                  "/app/src/app/not-found.jsx",
                ],
                forbidden: [
                  () => Promise.resolve().then(c.t.bind(c, 90461, 23)),
                  "next/dist/client/components/builtin/forbidden.js",
                ],
                unauthorized: [
                  () => Promise.resolve().then(c.t.bind(c, 32768, 23)),
                  "next/dist/client/components/builtin/unauthorized.js",
                ],
                metadata: {
                  icon: [
                    async (a) =>
                      (await Promise.resolve().then(c.bind(c, 78162))).default(
                        a,
                      ),
                  ],
                  apple: [],
                  openGraph: [],
                  twitter: [],
                  manifest: void 0,
                },
              },
            ],
          }.children,
          I = ["/app/src/app/(apps layout)/admin/config/page.jsx"],
          J = { require: c, loadChunk: () => Promise.resolve() },
          K = new d.AppPageRouteModule({
            definition: {
              kind: e.RouteKind.APP_PAGE,
              page: "/(apps layout)/admin/config/page",
              pathname: "/admin/config",
              bundlePath: "",
              filename: "",
              appPaths: [],
            },
            userland: { loaderTree: H },
            distDir: ".next",
            relativeProjectDir: "",
          });
        async function L(a, b, d) {
          var C;
          let G = "/(apps layout)/admin/config/page";
          "/index" === G && (G = "/");
          let M = (0, h.getRequestMeta)(a, "postponed"),
            N = (0, h.getRequestMeta)(a, "minimalMode"),
            O = await K.prepare(a, b, { srcPage: G, multiZoneDraftMode: !1 });
          if (!O)
            return (
              (b.statusCode = 400),
              b.end("Bad Request"),
              null == d.waitUntil || d.waitUntil.call(d, Promise.resolve()),
              null
            );
          let {
              buildId: P,
              query: Q,
              params: R,
              parsedUrl: S,
              pageIsDynamic: T,
              buildManifest: U,
              nextFontManifest: V,
              reactLoadableManifest: W,
              serverActionsManifest: X,
              clientReferenceManifest: Y,
              subresourceIntegrityManifest: Z,
              prerenderManifest: $,
              isDraftMode: _,
              resolvedPathname: aa,
              revalidateOnlyGenerated: ab,
              routerServerContext: ac,
              nextConfig: ad,
              interceptionRoutePatterns: ae,
            } = O,
            af = S.pathname || "/",
            ag = (0, r.normalizeAppPath)(G),
            { isOnDemandRevalidate: ah } = O,
            ai = K.match(af, $),
            aj = !!$.routes[aa],
            ak = !!(ai || aj || $.routes[ag]),
            al = a.headers["user-agent"] || "",
            am = (0, u.getBotType)(al),
            an = (0, p.isHtmlBotRequest)(a),
            ao =
              (0, h.getRequestMeta)(a, "isPrefetchRSCRequest") ??
              "1" === a.headers[t.NEXT_ROUTER_PREFETCH_HEADER],
            ap =
              (0, h.getRequestMeta)(a, "isRSCRequest") ??
              !!a.headers[t.RSC_HEADER],
            aq = (0, s.getIsPossibleServerAction)(a),
            ar =
              (0, m.checkIsAppPPREnabled)(ad.experimental.ppr) &&
              (null == (C = $.routes[ag] ?? $.dynamicRoutes[ag])
                ? void 0
                : C.renderingMode) === "PARTIALLY_STATIC",
            as = !1,
            at = !1,
            au = ar ? M : void 0,
            av = ar && ap && !ao,
            aw = (0, h.getRequestMeta)(a, "segmentPrefetchRSCRequest"),
            ax =
              !al ||
              (0, p.shouldServeStreamingMetadata)(al, ad.htmlLimitedBots);
          an && ar && ((ak = !1), (ax = !1));
          let ay = !0 === K.isDev || !ak || "string" == typeof M || av,
            az = an && ar,
            aA = null;
          _ || !ak || ay || aq || au || av || (aA = aa);
          let aB = aA;
          (!aB && K.isDev && (aB = aa),
            K.isDev || _ || !ak || !ap || av || (0, k.d)(a.headers));
          let aC = {
            ...E,
            tree: H,
            pages: I,
            GlobalError: D(),
            handler: L,
            routeModule: K,
            __next_app__: J,
          };
          X &&
            Y &&
            (0, o.setReferenceManifestsSingleton)({
              page: G,
              clientReferenceManifest: Y,
              serverActionsManifest: X,
              serverModuleMap: (0, q.createServerModuleMap)({
                serverActionsManifest: X,
              }),
            });
          let aD = a.method || "GET",
            aE = (0, g.getTracer)(),
            aF = aE.getActiveScopeSpan();
          try {
            let f = K.getVaryHeader(aa, ae);
            b.setHeader("Vary", f);
            let k = async (c, d) => {
                let e = new l.NodeNextRequest(a),
                  f = new l.NodeNextResponse(b);
                return K.render(e, f, d).finally(() => {
                  if (!c) return;
                  c.setAttributes({
                    "http.status_code": b.statusCode,
                    "next.rsc": !1,
                  });
                  let d = aE.getRootSpanAttributes();
                  if (!d) return;
                  if (
                    d.get("next.span_type") !== i.BaseServerSpan.handleRequest
                  )
                    return void console.warn(
                      `Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`,
                    );
                  let e = d.get("next.route");
                  if (e) {
                    let a = `${aD} ${e}`;
                    (c.setAttributes({
                      "next.route": e,
                      "http.route": e,
                      "next.span_name": a,
                    }),
                      c.updateName(a));
                  } else c.updateName(`${aD} ${a.url}`);
                });
              },
              m = async ({ span: e, postponed: f, fallbackRouteParams: g }) => {
                let i = {
                    query: Q,
                    params: R,
                    page: ag,
                    sharedContext: { buildId: P },
                    serverComponentsHmrCache: (0, h.getRequestMeta)(
                      a,
                      "serverComponentsHmrCache",
                    ),
                    fallbackRouteParams: g,
                    renderOpts: {
                      App: () => null,
                      Document: () => null,
                      pageConfig: {},
                      ComponentMod: aC,
                      Component: (0, j.T)(aC),
                      params: R,
                      routeModule: K,
                      page: G,
                      postponed: f,
                      shouldWaitOnAllReady: az,
                      serveStreamingMetadata: ax,
                      supportsDynamicResponse: "string" == typeof f || ay,
                      buildManifest: U,
                      nextFontManifest: V,
                      reactLoadableManifest: W,
                      subresourceIntegrityManifest: Z,
                      serverActionsManifest: X,
                      clientReferenceManifest: Y,
                      setIsrStatus: null == ac ? void 0 : ac.setIsrStatus,
                      dir: c(33873).join(process.cwd(), K.relativeProjectDir),
                      isDraftMode: _,
                      isRevalidate: ak && !f && !av,
                      botType: am,
                      isOnDemandRevalidate: ah,
                      isPossibleServerAction: aq,
                      assetPrefix: ad.assetPrefix,
                      nextConfigOutput: ad.output,
                      crossOrigin: ad.crossOrigin,
                      trailingSlash: ad.trailingSlash,
                      previewProps: $.preview,
                      deploymentId: ad.deploymentId,
                      enableTainting: ad.experimental.taint,
                      htmlLimitedBots: ad.htmlLimitedBots,
                      devtoolSegmentExplorer:
                        ad.experimental.devtoolSegmentExplorer,
                      reactMaxHeadersLength: ad.reactMaxHeadersLength,
                      multiZoneDraftMode: !1,
                      incrementalCache: (0, h.getRequestMeta)(
                        a,
                        "incrementalCache",
                      ),
                      cacheLifeProfiles: ad.experimental.cacheLife,
                      basePath: ad.basePath,
                      serverActions: ad.experimental.serverActions,
                      ...(as
                        ? {
                            nextExport: !0,
                            supportsDynamicResponse: !1,
                            isStaticGeneration: !0,
                            isRevalidate: !0,
                            isDebugDynamicAccesses: as,
                          }
                        : {}),
                      experimental: {
                        isRoutePPREnabled: ar,
                        expireTime: ad.expireTime,
                        staleTimes: ad.experimental.staleTimes,
                        cacheComponents: !!ad.experimental.cacheComponents,
                        clientSegmentCache:
                          !!ad.experimental.clientSegmentCache,
                        clientParamParsing:
                          !!ad.experimental.clientParamParsing,
                        dynamicOnHover: !!ad.experimental.dynamicOnHover,
                        inlineCss: !!ad.experimental.inlineCss,
                        authInterrupts: !!ad.experimental.authInterrupts,
                        clientTraceMetadata:
                          ad.experimental.clientTraceMetadata || [],
                      },
                      waitUntil: d.waitUntil,
                      onClose: (a) => {
                        b.on("close", a);
                      },
                      onAfterTaskError: () => {},
                      onInstrumentationRequestError: (b, c, d) =>
                        K.onRequestError(a, b, d, ac),
                      err: (0, h.getRequestMeta)(a, "invokeError"),
                      dev: K.isDev,
                    },
                  },
                  l = await k(e, i),
                  { metadata: m } = l,
                  { cacheControl: n, headers: o = {}, fetchTags: p } = m;
                if (
                  (p && (o[y.NEXT_CACHE_TAGS_HEADER] = p),
                  (a.fetchMetrics = m.fetchMetrics),
                  ak &&
                    (null == n ? void 0 : n.revalidate) === 0 &&
                    !K.isDev &&
                    !ar)
                ) {
                  let a = m.staticBailoutInfo,
                    b = Object.defineProperty(
                      Error(`Page changed from static to dynamic at runtime ${aa}${(null == a ? void 0 : a.description) ? `, reason: ${a.description}` : ""}
see more here https://nextjs.org/docs/messages/app-static-to-dynamic-error`),
                      "__NEXT_ERROR_CODE",
                      { value: "E132", enumerable: !1, configurable: !0 },
                    );
                  if (null == a ? void 0 : a.stack) {
                    let c = a.stack;
                    b.stack = b.message + c.substring(c.indexOf("\n"));
                  }
                  throw b;
                }
                return {
                  value: {
                    kind: v.CachedRouteKind.APP_PAGE,
                    html: l,
                    headers: o,
                    rscData: m.flightData,
                    postponed: m.postponed,
                    status: m.statusCode,
                    segmentData: m.segmentData,
                  },
                  cacheControl: n,
                };
              },
              o = async ({
                hasResolved: c,
                previousCacheEntry: f,
                isRevalidating: g,
                span: i,
              }) => {
                let j,
                  k = !1 === K.isDev,
                  l = c || b.writableEnded;
                if (ah && ab && !f && !N)
                  return (
                    (null == ac ? void 0 : ac.render404)
                      ? await ac.render404(a, b)
                      : ((b.statusCode = 404),
                        b.end("This page could not be found")),
                    null
                  );
                if (
                  (ai && (j = (0, w.parseFallbackField)(ai.fallback)),
                  j === w.FallbackMode.PRERENDER &&
                    (0, u.isBot)(al) &&
                    (!ar || an) &&
                    (j = w.FallbackMode.BLOCKING_STATIC_RENDER),
                  (null == f ? void 0 : f.isStale) === -1 && (ah = !0),
                  ah &&
                    (j !== w.FallbackMode.NOT_FOUND || f) &&
                    (j = w.FallbackMode.BLOCKING_STATIC_RENDER),
                  !N &&
                    j !== w.FallbackMode.BLOCKING_STATIC_RENDER &&
                    aB &&
                    !l &&
                    !_ &&
                    T &&
                    (k || !aj))
                ) {
                  let b;
                  if ((k || ai) && j === w.FallbackMode.NOT_FOUND)
                    throw new B.NoFallbackError();
                  if (ar && !ap) {
                    let c =
                      "string" == typeof (null == ai ? void 0 : ai.fallback)
                        ? ai.fallback
                        : k
                          ? ag
                          : null;
                    if (
                      ((b = await K.handleResponse({
                        cacheKey: c,
                        req: a,
                        nextConfig: ad,
                        routeKind: e.RouteKind.APP_PAGE,
                        isFallback: !0,
                        prerenderManifest: $,
                        isRoutePPREnabled: ar,
                        responseGenerator: async () =>
                          m({
                            span: i,
                            postponed: void 0,
                            fallbackRouteParams: k || at ? (0, n.u)(ag) : null,
                          }),
                        waitUntil: d.waitUntil,
                      })),
                      null === b)
                    )
                      return null;
                    if (b) return (delete b.cacheControl, b);
                  }
                }
                let o = ah || g || !au ? void 0 : au;
                if (as && void 0 !== o)
                  return {
                    cacheControl: { revalidate: 1, expire: void 0 },
                    value: {
                      kind: v.CachedRouteKind.PAGES,
                      html: x.default.EMPTY,
                      pageData: {},
                      headers: void 0,
                      status: void 0,
                    },
                  };
                let p =
                  T &&
                  ar &&
                  ((0, h.getRequestMeta)(a, "renderFallbackShell") || at)
                    ? (0, n.u)(af)
                    : null;
                return m({ span: i, postponed: o, fallbackRouteParams: p });
              },
              p = async (c) => {
                var f, g, i, j, k;
                let l,
                  n = await K.handleResponse({
                    cacheKey: aA,
                    responseGenerator: (a) => o({ span: c, ...a }),
                    routeKind: e.RouteKind.APP_PAGE,
                    isOnDemandRevalidate: ah,
                    isRoutePPREnabled: ar,
                    req: a,
                    nextConfig: ad,
                    prerenderManifest: $,
                    waitUntil: d.waitUntil,
                  });
                if (
                  (_ &&
                    b.setHeader(
                      "Cache-Control",
                      "private, no-cache, no-store, max-age=0, must-revalidate",
                    ),
                  K.isDev &&
                    b.setHeader("Cache-Control", "no-store, must-revalidate"),
                  !n)
                ) {
                  if (aA)
                    throw Object.defineProperty(
                      Error(
                        "invariant: cache entry required but not generated",
                      ),
                      "__NEXT_ERROR_CODE",
                      { value: "E62", enumerable: !1, configurable: !0 },
                    );
                  return null;
                }
                if (
                  (null == (f = n.value) ? void 0 : f.kind) !==
                  v.CachedRouteKind.APP_PAGE
                )
                  throw Object.defineProperty(
                    Error(
                      `Invariant app-page handler received invalid cache entry ${null == (i = n.value) ? void 0 : i.kind}`,
                    ),
                    "__NEXT_ERROR_CODE",
                    { value: "E707", enumerable: !1, configurable: !0 },
                  );
                let p = "string" == typeof n.value.postponed;
                ak &&
                  !av &&
                  (!p || ao) &&
                  (N ||
                    b.setHeader(
                      "x-nextjs-cache",
                      ah
                        ? "REVALIDATED"
                        : n.isMiss
                          ? "MISS"
                          : n.isStale
                            ? "STALE"
                            : "HIT",
                    ),
                  b.setHeader(t.NEXT_IS_PRERENDER_HEADER, "1"));
                let { value: q } = n;
                if (au) l = { revalidate: 0, expire: void 0 };
                else if (N && ap && !ao && ar)
                  l = { revalidate: 0, expire: void 0 };
                else if (!K.isDev)
                  if (_) l = { revalidate: 0, expire: void 0 };
                  else if (ak) {
                    if (n.cacheControl)
                      if ("number" == typeof n.cacheControl.revalidate) {
                        if (n.cacheControl.revalidate < 1)
                          throw Object.defineProperty(
                            Error(
                              `Invalid revalidate configuration provided: ${n.cacheControl.revalidate} < 1`,
                            ),
                            "__NEXT_ERROR_CODE",
                            { value: "E22", enumerable: !1, configurable: !0 },
                          );
                        l = {
                          revalidate: n.cacheControl.revalidate,
                          expire:
                            (null == (j = n.cacheControl)
                              ? void 0
                              : j.expire) ?? ad.expireTime,
                        };
                      } else
                        l = { revalidate: y.CACHE_ONE_YEAR, expire: void 0 };
                  } else
                    b.getHeader("Cache-Control") ||
                      (l = { revalidate: 0, expire: void 0 });
                if (
                  ((n.cacheControl = l),
                  "string" == typeof aw &&
                    (null == q ? void 0 : q.kind) ===
                      v.CachedRouteKind.APP_PAGE &&
                    q.segmentData)
                ) {
                  b.setHeader(t.NEXT_DID_POSTPONE_HEADER, "2");
                  let c =
                    null == (k = q.headers)
                      ? void 0
                      : k[y.NEXT_CACHE_TAGS_HEADER];
                  N &&
                    ak &&
                    c &&
                    "string" == typeof c &&
                    b.setHeader(y.NEXT_CACHE_TAGS_HEADER, c);
                  let d = q.segmentData.get(aw);
                  return void 0 !== d
                    ? (0, A.sendRenderResult)({
                        req: a,
                        res: b,
                        generateEtags: ad.generateEtags,
                        poweredByHeader: ad.poweredByHeader,
                        result: x.default.fromStatic(
                          d,
                          t.RSC_CONTENT_TYPE_HEADER,
                        ),
                        cacheControl: n.cacheControl,
                      })
                    : ((b.statusCode = 204),
                      (0, A.sendRenderResult)({
                        req: a,
                        res: b,
                        generateEtags: ad.generateEtags,
                        poweredByHeader: ad.poweredByHeader,
                        result: x.default.EMPTY,
                        cacheControl: n.cacheControl,
                      }));
                }
                let r = (0, h.getRequestMeta)(a, "onCacheEntry");
                if (
                  r &&
                  (await r(
                    { ...n, value: { ...n.value, kind: "PAGE" } },
                    { url: (0, h.getRequestMeta)(a, "initURL") },
                  ))
                )
                  return null;
                if (p && au)
                  throw Object.defineProperty(
                    Error(
                      "Invariant: postponed state should not be present on a resume request",
                    ),
                    "__NEXT_ERROR_CODE",
                    { value: "E396", enumerable: !1, configurable: !0 },
                  );
                if (q.headers) {
                  let a = { ...q.headers };
                  for (let [c, d] of ((N && ak) ||
                    delete a[y.NEXT_CACHE_TAGS_HEADER],
                  Object.entries(a)))
                    if (void 0 !== d)
                      if (Array.isArray(d))
                        for (let a of d) b.appendHeader(c, a);
                      else
                        ("number" == typeof d && (d = d.toString()),
                          b.appendHeader(c, d));
                }
                let s =
                  null == (g = q.headers)
                    ? void 0
                    : g[y.NEXT_CACHE_TAGS_HEADER];
                if (
                  (N &&
                    ak &&
                    s &&
                    "string" == typeof s &&
                    b.setHeader(y.NEXT_CACHE_TAGS_HEADER, s),
                  !q.status || (ap && ar) || (b.statusCode = q.status),
                  !N &&
                    q.status &&
                    F.RedirectStatusCode[q.status] &&
                    ap &&
                    (b.statusCode = 200),
                  p && b.setHeader(t.NEXT_DID_POSTPONE_HEADER, "1"),
                  ap && !_)
                ) {
                  if (void 0 === q.rscData) {
                    if (q.postponed)
                      throw Object.defineProperty(
                        Error("Invariant: Expected postponed to be undefined"),
                        "__NEXT_ERROR_CODE",
                        { value: "E372", enumerable: !1, configurable: !0 },
                      );
                    return (0, A.sendRenderResult)({
                      req: a,
                      res: b,
                      generateEtags: ad.generateEtags,
                      poweredByHeader: ad.poweredByHeader,
                      result: q.html,
                      cacheControl: av
                        ? { revalidate: 0, expire: void 0 }
                        : n.cacheControl,
                    });
                  }
                  return (0, A.sendRenderResult)({
                    req: a,
                    res: b,
                    generateEtags: ad.generateEtags,
                    poweredByHeader: ad.poweredByHeader,
                    result: x.default.fromStatic(
                      q.rscData,
                      t.RSC_CONTENT_TYPE_HEADER,
                    ),
                    cacheControl: n.cacheControl,
                  });
                }
                let u = q.html;
                if (!p || N || ap)
                  return (0, A.sendRenderResult)({
                    req: a,
                    res: b,
                    generateEtags: ad.generateEtags,
                    poweredByHeader: ad.poweredByHeader,
                    result: u,
                    cacheControl: n.cacheControl,
                  });
                if (as)
                  return (
                    u.push(
                      new ReadableStream({
                        start(a) {
                          (a.enqueue(z.ENCODED_TAGS.CLOSED.BODY_AND_HTML),
                            a.close());
                        },
                      }),
                    ),
                    (0, A.sendRenderResult)({
                      req: a,
                      res: b,
                      generateEtags: ad.generateEtags,
                      poweredByHeader: ad.poweredByHeader,
                      result: u,
                      cacheControl: { revalidate: 0, expire: void 0 },
                    })
                  );
                let w = new TransformStream();
                return (
                  u.push(w.readable),
                  m({
                    span: c,
                    postponed: q.postponed,
                    fallbackRouteParams: null,
                  })
                    .then(async (a) => {
                      var b, c;
                      if (!a)
                        throw Object.defineProperty(
                          Error("Invariant: expected a result to be returned"),
                          "__NEXT_ERROR_CODE",
                          { value: "E463", enumerable: !1, configurable: !0 },
                        );
                      if (
                        (null == (b = a.value) ? void 0 : b.kind) !==
                        v.CachedRouteKind.APP_PAGE
                      )
                        throw Object.defineProperty(
                          Error(
                            `Invariant: expected a page response, got ${null == (c = a.value) ? void 0 : c.kind}`,
                          ),
                          "__NEXT_ERROR_CODE",
                          { value: "E305", enumerable: !1, configurable: !0 },
                        );
                      await a.value.html.pipeTo(w.writable);
                    })
                    .catch((a) => {
                      w.writable.abort(a).catch((a) => {
                        console.error("couldn't abort transformer", a);
                      });
                    }),
                  (0, A.sendRenderResult)({
                    req: a,
                    res: b,
                    generateEtags: ad.generateEtags,
                    poweredByHeader: ad.poweredByHeader,
                    result: u,
                    cacheControl: { revalidate: 0, expire: void 0 },
                  })
                );
              };
            if (!aF)
              return await aE.withPropagatedContext(a.headers, () =>
                aE.trace(
                  i.BaseServerSpan.handleRequest,
                  {
                    spanName: `${aD} ${a.url}`,
                    kind: g.SpanKind.SERVER,
                    attributes: { "http.method": aD, "http.target": a.url },
                  },
                  p,
                ),
              );
            await p(aF);
          } catch (b) {
            throw (
              b instanceof B.NoFallbackError ||
                (await K.onRequestError(
                  a,
                  b,
                  {
                    routerKind: "App Router",
                    routePath: G,
                    routeType: "render",
                    revalidateReason: (0, f.c)({
                      isRevalidate: ak,
                      isOnDemandRevalidate: ah,
                    }),
                  },
                  ac,
                )),
              b
            );
          }
        }
      },
      89626: (a, b, c) => {
        "use strict";
        c.d(b, { A: () => H });
        var d,
          e = c(68813),
          f = c.n(e),
          g = c(80694),
          h = c(1164),
          i = c(19009),
          j = c(59679);
        function k(a) {
          if (((!d && 0 !== d) || a) && h.default) {
            var b = document.createElement("div");
            ((b.style.position = "absolute"),
              (b.style.top = "-9999px"),
              (b.style.width = "50px"),
              (b.style.height = "50px"),
              (b.style.overflow = "scroll"),
              document.body.appendChild(b),
              (d = b.offsetWidth - b.clientWidth),
              document.body.removeChild(b));
          }
          return d;
        }
        var l = c(38301),
          m = c(74678),
          n = c(33540),
          o = c(23862),
          p = c(62241),
          q = c(569),
          r = c(81944),
          s = c(97141),
          t = c(67971),
          u = c(21124);
        let v = l.forwardRef(
          ({ className: a, bsPrefix: b, as: c = "div", ...d }, e) => (
            (b = (0, t.oU)(b, "modal-body")),
            (0, u.jsx)(c, { ref: e, className: f()(a, b), ...d })
          ),
        );
        v.displayName = "ModalBody";
        var w = c(46967);
        let x = l.forwardRef(
          (
            {
              bsPrefix: a,
              className: b,
              contentClassName: c,
              centered: d,
              size: e,
              fullscreen: g,
              children: h,
              scrollable: i,
              ...j
            },
            k,
          ) => {
            a = (0, t.oU)(a, "modal");
            let l = `${a}-dialog`,
              m =
                "string" == typeof g
                  ? `${a}-fullscreen-${g}`
                  : `${a}-fullscreen`;
            return (0, u.jsx)("div", {
              ...j,
              ref: k,
              className: f()(
                l,
                b,
                e && `${a}-${e}`,
                d && `${l}-centered`,
                i && `${l}-scrollable`,
                g && m,
              ),
              children: (0, u.jsx)("div", {
                className: f()(`${a}-content`, c),
                children: h,
              }),
            });
          },
        );
        x.displayName = "ModalDialog";
        let y = x,
          z = l.forwardRef(
            ({ className: a, bsPrefix: b, as: c = "div", ...d }, e) => (
              (b = (0, t.oU)(b, "modal-footer")),
              (0, u.jsx)(c, { ref: e, className: f()(a, b), ...d })
            ),
          );
        z.displayName = "ModalFooter";
        var A = c(14733);
        let B = l.forwardRef(
          (
            {
              bsPrefix: a,
              className: b,
              closeLabel: c = "Close",
              closeButton: d = !1,
              ...e
            },
            g,
          ) => (
            (a = (0, t.oU)(a, "modal-header")),
            (0, u.jsx)(A.A, {
              ref: g,
              ...e,
              className: f()(b, a),
              closeLabel: c,
              closeButton: d,
            })
          ),
        );
        B.displayName = "ModalHeader";
        let C = (0, c(90565).A)("h4"),
          D = l.forwardRef(
            ({ className: a, bsPrefix: b, as: c = C, ...d }, e) => (
              (b = (0, t.oU)(b, "modal-title")),
              (0, u.jsx)(c, { ref: e, className: f()(a, b), ...d })
            ),
          );
        function E(a) {
          return (0, u.jsx)(s.A, { ...a, timeout: null });
        }
        function F(a) {
          return (0, u.jsx)(s.A, { ...a, timeout: null });
        }
        D.displayName = "ModalTitle";
        let G = l.forwardRef(
          (
            {
              bsPrefix: a,
              className: b,
              style: c,
              dialogClassName: d,
              contentClassName: e,
              children: s,
              dialogAs: v = y,
              "data-bs-theme": x,
              "aria-labelledby": z,
              "aria-describedby": A,
              "aria-label": B,
              show: C = !1,
              animation: D = !0,
              backdrop: G = !0,
              keyboard: H = !0,
              onEscapeKeyDown: I,
              onShow: J,
              onHide: K,
              container: L,
              autoFocus: M = !0,
              enforceFocus: N = !0,
              restoreFocus: O = !0,
              restoreFocusOptions: P,
              onEntered: Q,
              onExit: R,
              onExiting: S,
              onEnter: T,
              onEntering: U,
              onExited: V,
              backdropClassName: W,
              manager: X,
              ...Y
            },
            Z,
          ) => {
            let [$, _] = (0, l.useState)({}),
              [aa, ab] = (0, l.useState)(!1),
              ac = (0, l.useRef)(!1),
              ad = (0, l.useRef)(!1),
              ae = (0, l.useRef)(null),
              [af, ag] = (0, l.useState)(null),
              ah = (0, n.A)(Z, ag),
              ai = (0, m.A)(K),
              aj = (0, t.Wz)();
            a = (0, t.oU)(a, "modal");
            let ak = (0, l.useMemo)(() => ({ onHide: ai }), [ai]);
            function al() {
              return X || (0, r.R)({ isRTL: aj });
            }
            function am(a) {
              if (!h.default) return;
              let b = al().getScrollbarWidth() > 0,
                c =
                  a.scrollHeight >
                  (0, i.default)(a).documentElement.clientHeight;
              _({
                paddingRight: b && !c ? k() : void 0,
                paddingLeft: !b && c ? k() : void 0,
              });
            }
            let an = (0, m.A)(() => {
              af && am(af.dialog);
            });
            (0, o.A)(() => {
              ((0, j.A)(window, "resize", an),
                null == ae.current || ae.current());
            });
            let ao = () => {
                ac.current = !0;
              },
              ap = (a) => {
                (ac.current &&
                  af &&
                  a.target === af.dialog &&
                  (ad.current = !0),
                  (ac.current = !1));
              },
              aq = () => {
                (ab(!0),
                  (ae.current = (0, p.A)(af.dialog, () => {
                    ab(!1);
                  })));
              },
              ar = (a) => {
                if ("static" === G)
                  return void ((a) => {
                    a.target === a.currentTarget && aq();
                  })(a);
                if (ad.current || a.target !== a.currentTarget) {
                  ad.current = !1;
                  return;
                }
                null == K || K();
              },
              as = (0, l.useCallback)(
                (b) =>
                  (0, u.jsx)("div", {
                    ...b,
                    className: f()(`${a}-backdrop`, W, !D && "show"),
                  }),
                [D, W, a],
              ),
              at = { ...c, ...$ };
            return (
              (at.display = "block"),
              (0, u.jsx)(w.A.Provider, {
                value: ak,
                children: (0, u.jsx)(q.A, {
                  show: C,
                  ref: ah,
                  backdrop: G,
                  container: L,
                  keyboard: !0,
                  autoFocus: M,
                  enforceFocus: N,
                  restoreFocus: O,
                  restoreFocusOptions: P,
                  onEscapeKeyDown: (a) => {
                    H
                      ? null == I || I(a)
                      : (a.preventDefault(), "static" === G && aq());
                  },
                  onShow: J,
                  onHide: K,
                  onEnter: (a, b) => {
                    (a && am(a), null == T || T(a, b));
                  },
                  onEntering: (a, b) => {
                    (null == U || U(a, b),
                      (0, g.default)(window, "resize", an));
                  },
                  onEntered: Q,
                  onExit: (a) => {
                    (null == ae.current || ae.current(), null == R || R(a));
                  },
                  onExiting: S,
                  onExited: (a) => {
                    (a && (a.style.display = ""),
                      null == V || V(a),
                      (0, j.A)(window, "resize", an));
                  },
                  manager: al(),
                  transition: D ? E : void 0,
                  backdropTransition: D ? F : void 0,
                  renderBackdrop: as,
                  renderDialog: (c) =>
                    (0, u.jsx)("div", {
                      role: "dialog",
                      ...c,
                      style: at,
                      className: f()(b, a, aa && `${a}-static`, !D && "show"),
                      onClick: G ? ar : void 0,
                      onMouseUp: ap,
                      "data-bs-theme": x,
                      "aria-label": B,
                      "aria-labelledby": z,
                      "aria-describedby": A,
                      children: (0, u.jsx)(v, {
                        ...Y,
                        onMouseDown: ao,
                        className: d,
                        contentClassName: e,
                        children: s,
                      }),
                    }),
                }),
              })
            );
          },
        );
        G.displayName = "Modal";
        let H = Object.assign(G, {
          Body: v,
          Header: B,
          Title: D,
          Footer: z,
          Dialog: y,
          TRANSITION_DURATION: 300,
          BACKDROP_TRANSITION_DURATION: 150,
        });
      },
      91770: (a, b, c) => {
        "use strict";
        b.A = void 0;
        var d = (function (a, b) {
            if (a && a.__esModule) return a;
            if (null === a || ("object" != typeof a && "function" != typeof a))
              return { default: a };
            var c = l(b);
            if (c && c.has(a)) return c.get(a);
            var d = { __proto__: null },
              e = Object.defineProperty && Object.getOwnPropertyDescriptor;
            for (var f in a)
              if ("default" !== f && {}.hasOwnProperty.call(a, f)) {
                var g = e ? Object.getOwnPropertyDescriptor(a, f) : null;
                g && (g.get || g.set)
                  ? Object.defineProperty(d, f, g)
                  : (d[f] = a[f]);
              }
            return ((d.default = a), c && c.set(a, d), d);
          })(c(38301)),
          e = c(42225),
          f = c(98288),
          g = k(c(85988)),
          h = k(c(30447)),
          i = k(c(78221)),
          j = c(21124);
        function k(a) {
          return a && a.__esModule ? a : { default: a };
        }
        function l(a) {
          if ("function" != typeof WeakMap) return null;
          var b = new WeakMap(),
            c = new WeakMap();
          return (l = function (a) {
            return a ? c : b;
          })(a);
        }
        let m = (a) => {
          let {
              id: b,
              generateChildId: c,
              onSelect: i,
              activeKey: k,
              defaultActiveKey: l,
              transition: m,
              mountOnEnter: n,
              unmountOnExit: o,
              children: p,
            } = a,
            [q, r] = (0, e.useUncontrolledProp)(k, l, i),
            s = (0, f.useSSRSafeId)(b),
            t = (0, d.useMemo)(
              () => c || ((a, b) => (s ? `${s}-${b}-${a}` : null)),
              [s, c],
            ),
            u = (0, d.useMemo)(
              () => ({
                onSelect: r,
                activeKey: q,
                transition: m,
                mountOnEnter: n || !1,
                unmountOnExit: o || !1,
                getControlledId: (a) => t(a, "tabpane"),
                getControllerId: (a) => t(a, "tab"),
              }),
              [r, q, m, n, o, t],
            );
          return (0, j.jsx)(g.default.Provider, {
            value: u,
            children: (0, j.jsx)(h.default.Provider, {
              value: r || null,
              children: p,
            }),
          });
        };
        ((m.Panel = i.default), (b.A = m));
      },
    }));
  var b = require("../../../../webpack-runtime.js");
  b.C(a);
  var c = b.X(0, [4586, 3278, 7464, 506, 1559, 2667, 5572], () =>
    b((b.s = 87936)),
  );
  module.exports = c;
})();
