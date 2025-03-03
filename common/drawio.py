from file import XMLData, TextLineData
import xml.etree.ElementTree as ET


class DrawIO(XMLData):
    STYLE = {
        "FRAME":"shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;align=left;spacingLeft=6;fontStyle=5;overflow=hidden;whiteSpace=wrap;html=1;",
        "LEFT":"shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;fontStyle=1;overflow=hidden;whiteSpace=wrap;html=1;",
        "RIGHT":"shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;align=left;spacingLeft=6;fontStyle=5;overflow=hidden;whiteSpace=wrap;html=1;",
        "ROW":"shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;fillColor=none;collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;top=0;left=0;right=0;bottom=0;html=1;",
        "BORDERROW":"shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;fillColor=none;collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;top=0;left=0;right=0;bottom=1;html=1;",
    }

    def __init__(self,file_path,encoding="utf-8"):
        super().__init__(file_path,encoding)
        self.drawio_init()
        self.index = 0
        self._target = None

    def drawio_init(self):
        if self.data is None:
            f = TextLineData(self.file_path)
            f.data.append('<?xml version="1.0" encoding="UTF-8"?>\n')
            f.data.append('<mxfile host="Electron" agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) draw.io/26.0.16 Chrome/132.0.6834.196 Electron/34.2.0 Safari/537.36" version="26.0.16" pages="2">\n')
            f.data.append('</mxfile>')
            f.write()
            self.read()

    def find(self,path,key,val):
        items = self.root.findall(path)
        target = None
        for item in items:
            if item.get(key) == val:
                target = item
        return target

    @property
    def pages(self):
        diagrams = self.findall("diagram")
        return diagrams
    
    @property
    def page(self):
        return self.pages[self.index]
    
    @property
    def last_page(self):
        return self.pages[len(self.pages) - 1]
    
    @property
    def first_page(self):
        return self.pages[0]
    
    @property
    def root(self):
        """ アクティブなページのmxGraphModel配下にあるrootのDOM
        ```
        <mxfile>
            <diagram>
                <mxGraphModel>
                    <root>
        ```
        """
        return self.findall(".//root")[self.index]
    
    @property
    def cel0(self):
        return self.page.find(".//mxCell","id","0")
    
    @property
    def cel1(self):
        return self.page.find(".//mxCell","id","1")
    
    @property
    def target(self):
        result = None
        if self._target is not None:
            result = self._target
        else:
            result = self.root
        return result
    
    @target.setter
    def target(self,dom):
        self._target = dom
    
    def id(self,name):
        return {"id":"{}-{}-{}".format(self.page.get("id"),name,len(self.page.findall(".//{}".format(name))))}
    
    def activate(self,index):
        result = None
        if index < len(self.pages):
            self.index = index
            result = self.page
        return result
    
    def pg(self,name="page",properties={}):
        counter = len(self.pages)
        props = {"id":"{}-{}".format(name,counter + 1),"name":"{}{}".format(name,counter + 1)}
        diagram = self.create("diagram",{**props,**properties})
        self.data.append(diagram)
        self.index = counter
        return diagram
    
    def graph(self,properties={"dx":"1434", "dy":"837", "grid":"1", "gridSize":"10", "guides":"1", "tooltips":"1", "connect":"1", "arrows":"1", "fold":"1", "page":"1", "pageScale":"1", "pageWidth":"827", "pageHeight":"1169", "math":"0", "shadow":"0"}):
        """ ### mxGraphModelを生成
        dx, dy: グリッドの間隔
        grid: グリッドの表示（1: 表示, 0: 非表示）
        guides: スナップガイドの使用（1: 有効, 0: 無効）
        tooltips: ツールチップの表示（1: 有効, 0: 無効）
        connect: 接続の許可（1: 許可, 0: 禁止）
        arrows: 矢印キーの使用（1: 許可, 0: 禁止）
        fold: 折りたたみ可能なノード（1: 許可, 0: 禁止）
        page: ページの有効化（1: 有効, 0: 無効）
        pageWidth / pageHeight: ページサイズ
        """
        # properties = {"dx":"1434", "dy":"837", "grid":"1", "gridSize":"10", "guides":"1", "tooltips":"1", "connect":"1", "arrows":"1", "fold":"1", "page":"1", "pageScale":"1", "pageWidth":"827", "pageHeight":"1169", "math":"0", "shadow":"0"}
        graph_model = self.create("mxGraphModel",properties)
        self.page.append(graph_model)
        graph_model.append(self.create("root"))
        # ダミーセル、既定の親セルを配置 DrawIOの習慣
        cell0 = self.create("mxCell",{"id":"0"})
        cell1 = self.create("mxCell",{"id":"1","parent":"0"})
        self.root.append(cell0)
        self.root.append(cell1)
        return graph_model


    def cell(self,properties={}):
        """ ### mxCellを生成するメソッド
        id: 一意の識別子
        parent: 親要素の id
        vertex: 頂点（1: 図形, 0: 図形でない）
        edge: エッジ（1: 接続線, 0: 接続線でない）
        source: 接続元の mxCell の id
        target: 接続先の mxCell の id
        style: スタイル情報（色、線の種類など）
        value: テキスト
        """
        name = "mxCell"
        # props = {"id":"{}-{}-{}".format(self.page.get("id"),name,len(self.page.findall(".//{}".format(name))))}
        props = self.id(name)
        mx_cell = self.create("mxCell",{**props,**properties,**{"vertex":"1","parent":self.target.get("id") if self.target != self.root else "1"}})
        return mx_cell
    
    def geometry(self,properties={}):
        """ ### mxGeometry(mxCellの子要素)を生成するメソッド
        x, y: 位置
        width, height: サイズ
        relative: 相対位置（1: 親要素に対して相対, 0: 絶対）
        as: geometry
        """

        name = "mxGeometry"
        props = self.id(name)
        # props = {"id":"{}-{}-{}".format(self.page.get("id"),name,len(self.page.findall(".//{}".format(name))))}
        geometry = self.create("mxGeometry",{**props, **properties, **{"as":"geometry"}})
        return geometry
    
    def point(self,properties={"x":"360","y":"480","as":"sourcePoint"}):
        """ ### mxPoint(mxGeometryの子要素)を生成するメソッド
        x: X座標
        y: Y座標
        as: この mxPoint の用途を示す（例: "sourcePoint", "targetPoint"）
        """
        name = "mxPoint"
        props = self.id(name)
        # props = {"id":"{}-{}-{}".format(self.page.get("id"),name,len(self.page.findall(".//{}".format(name))))}
        p = self.create("mxPoint",{**props, **properties})
        return p

    def rectangle(self,properties={}):
        """ ### mxRectangle
        x: X座標（矩形の左上のX）
        y: Y座標（矩形の左上のY）
        width: 矩形の幅
        height: 矩形の高さ
        as: この mxRectangle の用途を示す（例: "alternateBounds"）
        """
        name = "mxRectangle"
        props = self.id(name)
        # props = {"id":"{}-{}-{}".format(self.page.get("id"),name,len(self.page.findall(".//{}".format(name))))}
        r = self.create("mxRectangle",{**props, **properties, **{"as":"alternateBounds"}})
        return r

    def frame(self,title="",x="100",y="100",w="120",h="40"):
        cel = self.cell({**self.id("mxCell"),**{"value":title,"vertex":"1","style":DrawIO.STYLE["FRAME"]}})
        geom = self.geometry({"x":x,"y":y,"width":w,"height":h})
        rect = self.rectangle({"width":w,"height":h})
        cel.append(geom)
        geom.append(rect)
        self.root.append(cel)
        return cel

    def entity(self,point,data):
        x = point["x"]
        y = point["y"]
        w = point["width"]
        h = point["height"]
        frame = self.frame(data["name"],str(x),str(y),str(w),str(h))
        cols = data["columns"]
        for d in cols:
            y += 30
            row_h = 30
            rh = str(row_h)
            # ターゲットをフレームにする
            self.target = frame
            style=DrawIO.STYLE["ROW"]
            if d == cols[-1]:
                style = DrawIO.STYLE["BORDERROW"]
            row = self.cell({**self.id("mxCell"),**{"y":str(y),"width":str(w),"height":rh,"value":"","vertex":"1","style":style}})
            self.root.append(row)

            # ターゲットを行にする
            self.target = row
            left = self.cell({**self.id("mxCell"),**{"value":",".join(d["option"]),"vertex":"1","style":DrawIO.STYLE["LEFT"]}})
            self.root.append(left)
            right = self.cell({**self.id("mxCell"),**{"value":d["name"],"vertex":"1","style":DrawIO.STYLE["RIGHT"]}})
            self.root.append(right)

            # ターゲットを左セルにする
            self.target = left
            lw = str(int(w * 0.2))
            lgeom = self.geometry({"width":lw,"height":rh})
            lrect = self.rectangle({"width":lw,"height":rh})
            lgeom.append(lrect)
            left.append(lgeom)

            # ターゲットを右セルにする
            self.target = right
            rw = str(int(w * 0.8))
            rgeom = self.geometry({"width":rw,"height":rh,"x":lw})
            rrect = self.rectangle({"width":rw,"height":rh})
            rgeom.append(rrect)
            right.append(rgeom)

        self.target = self.root
        return frame
        
if __name__ == "__main__":
    point = {
        "x":100,
        "y":100,
        "width":180,
        "height":200,
    }
    data = {
        "name":"Table",
        "columns":[
            {"option":["PK","FK"],"name":"COLUMN1"},
            {"option":["PK",],"name":"COLUMN2"},
            {"option":[],"name":"COLUMN3"},
        ],
    }
    dio = DrawIO("etc/sample.drawio.xml")
    doms = [dio.pg("xxxxxx"),dio.graph(),dio.entity(point,data)]
    dio.write()