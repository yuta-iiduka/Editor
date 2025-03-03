#標準ライブラリ
import json,csv
import xml.etree.ElementTree as ET

class FileData():

    """
    file_path:読み書きしたいjsonファイルパス
    data:読み込んだファイルデータ
    _read:ファイルを読み込みをする関数（オーバーライド必須）
    _write:ファイル書き込みをする関数（オーバーライド必須）
    """
    def __init__(self,file_path,encoding="utf-8"):
        # json file path
        self.file_path = file_path
        # dict
        self._data = None
        self.encoding = encoding
        self.read()


    def read(self):
        """
        読み込み成功：True
        読み込み失敗：False
        """
        try:
            with open(self.file_path, "r", encoding=self.encoding) as file:
                # self._data = json.load(file)
                self._read(file)
                return True
        except Exception as e:
            print(e)
        return False

    def _read(self,file):
        """
        fileを読み込みself_dataにデータを格納する
        """
        self.data = file.read()
        return None

    def write(self):
        """
        書き込み成功：True
        書き込み失敗：False
        """
        try:
            with open(self.file_path, "w", encoding=self.encoding) as file:
                # json.dump(self._data,file,indent=4,ensure_ascii=False)
                self._write(file)
            return True
        except Exception as e:
            print(e)
            return False
        
    def _write(self,file):
        """
        fileにself_dataを書き込む
        """
        file.write()
        return None

    @property
    def data(self):
        return self._data
  
    @data.setter
    def data(self,data):
        self._data = data


class JsonData(FileData):
    def __init__(self,file_path):
        super().__init__(file_path)

    def _read(self,file):
        self.data = json.load(file)

    def _write(self,file):
        json.dump(self.data,file,indent=4,ensure_ascii=False)

class TextData(FileData):
    def __init__(self,file_path):
        super().__init__(file_path)

    def _read(self, file):
        self.data = file.read()

    def _write(self, file):
        file.write(self.data)

class TextLineData(FileData):
    def __init__(self,file_path):
        super().__init__(file_path)

    def _read(self, file):
        self.data = file.readlines()

    def _write(self, file):
        file.writelines(self.data)


class CSVData(FileData):
    def __init__(self,file_path,encoding="utf-8-sig"):
        super().__init__(file_path,encoding)
        self.encoding = encoding

    def _read(self,file):
        reader = csv.reader(file, delimiter=",")
        self.data = [row for row in reader]
        # csv.DictReader(file, fieldnames=["field1","field2"])

    def _write(self,file):
        writer = csv.writer(file)
        writer.writerows(self.data)
        # csv.DictWriter(file, fieldnames=["field1","field2"])


class XMLData(FileData):
    def __init__(self,file_path,encoding="utf-8"):
        self.tree = None
        super().__init__(file_path,encoding)
    
    def _read(self,file):
        self.tree = ET.parse(self.file_path)
        self.data = self.tree.getroot()

    def _write(self,file):
        ET.indent(self.tree,space="  ")
        self.tree.write(self.file_path,encoding=self.encoding,xml_declaration=True)

    def findall(self,path):
        return self.data.findall(path)

    def find(self,path,key,val):
        items = self.findall(path)
        target = None
        for item in items:
            if item.get(key) == val:
                target = item
        return target
    
    def create(self,itemName,attributes={},text=None):
        elm = ET.Element(itemName,attributes)
        if text is not None:
            elm.text = text
        # self.data.append(elm)
        return elm

class JsonEnv(JsonData):
    def __init__(self):
        super().__init__("param/env.json")
        self.env = self.data["env"]

if __name__ == "__main__":
    # TextData("param/const.json")  
    # JsonEnv()
    # CSVData("sample.csv")
    d = XMLData("etc/sample.drawio.xml")

