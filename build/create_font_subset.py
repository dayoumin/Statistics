#!/usr/bin/env python3
"""
한글 폰트 서브셋 생성 및 Base64 인코딩
Pretendard 폰트를 사용하여 필요한 문자만 포함된 경량 폰트 생성
"""

import os
import base64
import urllib.request
from pathlib import Path
from fontTools import subset
import json

class FontSubsetter:
    def __init__(self):
        self.cache_dir = Path("cache/fonts")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir = Path("assets/fonts")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def download_font(self):
        """Pretendard 폰트 다운로드"""
        # Pretendard 최신 버전 URL
        font_urls = {
            "regular": "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/woff2/Pretendard-Regular.woff2",
            "bold": "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/woff2/Pretendard-Bold.woff2"
        }
        
        fonts = {}
        for weight, url in font_urls.items():
            cache_path = self.cache_dir / f"Pretendard-{weight.capitalize()}.woff2"
            
            if cache_path.exists():
                print(f"캐시에서 로드: {weight}")
                fonts[weight] = cache_path
            else:
                print(f"다운로드 중: {weight}")
                try:
                    response = urllib.request.urlopen(url)
                    data = response.read()
                    cache_path.write_bytes(data)
                    fonts[weight] = cache_path
                except Exception as e:
                    print(f"다운로드 실패: {e}")
                    return None
        
        return fonts
    
    def get_required_characters(self):
        """통계 앱에 필요한 문자 집합 정의"""
        characters = set()
        
        # 1. 기본 ASCII (영문, 숫자, 특수문자)
        for i in range(32, 127):
            characters.add(chr(i))
        
        # 2. 한글 자모 (완성형)
        # 가장 자주 사용되는 한글 2350자
        common_korean = """
        가각간갇갈갉감갑값갓갔강갖갗같갚갛개객갠갤갬갭갯갰갱갸갹갼걀걋걍걔걘걜거걱건걷걸걺검겁것겄겅겆겉겊겋게겐겔겜겝겟겠겡겨격겪견겯결겸겹겻겼경곁계곈곌곕곗고곡곤곧골곪곬곯곰곱곳공곶과곽관괄괆괌괍괏광괘괜괠괩괬괭괴괵괸괼굄굅굇굉교굔굘굡굣구국군굳굴굵굶굻굼굽굿궁궂궈궉권궐궜궝궤궷귀귁귄귈귐귑귓규균귤그극근귿글긁금급긋긍긔기긱긴긷길긺김깁깃깅깆깊까깍깎깐깔깖깜깝깟깠깡깥깨깩깬깰깸깹깻깼깽꺄꺅꺌꺼꺽꺾껀껄껌껍껏껐껑께껙껜껨껫껭껴껸껼꼇꼈꼍꼐꼬꼭꼰꼲꼴꼼꼽꼿꽁꽂꽃꽈꽉꽐꽜꽝꽤꽥꽹꾀꾄꾈꾐꾑꾕꾜꾸꾹꾼꿀꿇꿈꿉꿋꿍꿎꿔꿜꿨꿩꿰꿱꿴꿸뀀뀁뀄뀌뀐뀔뀜뀝뀨끄끅끈끊끌끎끓끔끕끗끙끝끼끽낀낄낌낍낏낑나낙낚난낟날낡낢남납낫났낭낮낯낱낳내낵낸낼냄냅냇냈냉냐냑냔냘냠냥너넉넋넌널넒넓넘넙넛넜넝넣네넥넨넬넴넵넷넸넹녀녁년녈념녑녔녕녘녜녠노녹논놀놂놈놉놋농높놓놔놘놜놨뇌뇐뇔뇜뇝뇟뇨뇩뇬뇰뇹뇻뇽누눅눈눋눌눔눕눗눙눠눴눼뉘뉜뉠뉨뉩뉴뉵뉼늄늅늉느늑는늘늙늚늠늡늣능늦늪늬늰늴니닉닌닐닒님닙닛닝닢다닥닦단닫달닭닮닯닳담답닷닸당닺닻닿대댁댄댈댐댑댓댔댕댜더덕덖던덛덜덞덟덤덥덧덩덫덮데덱덴델뎀뎁뎃뎄뎅뎌뎐뎔뎠뎡뎨뎬도독돈돋돌돎돐돔돕돗동돛돝돠돤돨돼됐되된될됨됩됫됴두둑둔둘둠둡둣둥둬뒀뒈뒝뒤뒨뒬뒵뒷뒹듀듄듈듐듕드득든듣들듦듬듭듯등듸디딕딘딛딜딤딥딧딨딩딪따딱딴딸땀땁땃땄땅땋때땍땐땔땜땝땟땠땡떠떡떤떨떪떫떰떱떳떴떵떻떼떽뗀뗄뗌뗍뗏뗐뗑뗘뗬또똑똔똘똥똬똴뙈뙤뙨뚜뚝뚠뚤뚫뚬뚱뛔뛰뛴뛸뜀뜁뜅뜨뜩뜬뜯뜰뜸뜹뜻띄띈띌띔띕띠띤띨띰띱띳띵라락란랄람랍랏랐랑랒랖랗래랙랜랠램랩랫랬랭랴략랸럇량러럭런럴럼럽럿렀렁렇레렉렌렐렘렙렛렝려력련렬렴렵렷렸령례롄롑롓로록론롤롬롭롯롱롸롼뢍뢨뢰뢴뢸룀룁룃룅료룐룔룝룟룡루룩룬룰룸룹룻룽뤄뤘뤠뤼뤽륀륄륌륏륑류륙륜률륨륩륫륭르륵른를름릅릇릉릊릍릎리릭린릴림립릿링마막만많맏말맑맒맘맙맛망맞맡맣매맥맨맬맴맵맷맸맹맺먀먁먈먕머먹먼멀멂멈멉멋멍멎멓메멕멘멜멤멥멧멨멩며멱면멸몃몄명몇몌모목몫몬몰몲몸몹못몽뫄뫈뫘뫙뫼묀묄묍묏묑묘묜묠묩묫묵묶문묻물묽묾뭄뭅뭇뭉뭍뭏뭐뭔뭘뭡뭣뭬뮈뮌뮐뮤뮨뮬뮴뮷므믄믈믐믓미믹민믿밀밂밈밉밋밌밍및밑바박밖밗반받발밝밞밟밤밥밧방밭배백밴밸뱀뱁뱃뱄뱅뱉뱌뱍뱐뱝버벅번벋벌벎범법벗벙벚베벡벤벧벨벰벱벳벴벵벼벽변별볍볏볐병볕볘볜보복볶본볼봄봅봇봉봐봔봤봬뵀뵈뵉뵌뵐뵘뵙뵤뵨부북분붇불붉붊붐붑붓붕붙붚붜붤붰붸뷔뷕뷘뷜뷩뷰뷴뷸븀븃븅브븍븐블븜븝븟비빅빈빌빎빔빕빗빙빚빛빠빡빤빨빪빰빱빳빴빵빻빼빽뺀뺄뺌뺍뺏뺐뺑뺘뺙뺨뻐뻑뻔뻗뻘뻠뻣뻤뻥뻬뼁뼈뼉뼘뼙뼛뼜뼝뽀뽁뽄뽈뽐뽑뽕뾔뾰뿅뿌뿍뿐뿔뿜뿟뿡쀼쁘쁜쁠쁨쁩삐삑삔삘삠삡삣삥사삭삯산삳살삵삶삼삽삿샀상샅새색샌샐샘샙샛샜생샤샥샨샬샴샵샷샹섀섄섈섐섕서석섞섟선섣설섦섧섬섭섯섰성섶세섹센셀셈셉셋셌셍셔셕션셜셤셥셧셨셩셰셴셸솅소속솎손솔솖솜솝솟송솥솨솩솬솰솽쇄쇈쇌쇔쇗쇘쇠쇤쇨쇰쇱쇳쇼쇽숀숄숌숍숏숑수숙순숟술숨숩숫숭숯숱숲숴쉈쉐쉑쉔쉘쉠쉥쉬쉭쉰쉴쉼쉽쉿슁슈슉슐슘슛슝스슥슨슬슭슴습슷승시식신싣실싫심십싯싱싶싸싹싻싼쌀쌈쌉쌌쌍쌓쌔쌕쌘쌜쌤쌥쌨쌩썅써썩썬썰썲썸썹썼썽쎄쎈쎌쏀쏘쏙쏜쏟쏠쏢쏨쏩쏭쏴쏵쏸쐈쐐쐤쐬쐰쐴쐼쐽쑈쑤쑥쑨쑬쑴쑵쑹쒀쒔쒜쒸쒼쓩쓰쓱쓴쓸쓺쓿씀씁씌씐씔씜씨씩씬씰씸씹씻씽아악안앉않알앍앎앓암압앗았앙앝앞애액앤앨앰앱앳앴앵야약얀얄얇얌얍얏양얕얗얘얜얠얩어억언얹얻얼얽얾엄업없엇었엉엊엌엎에엑엔엘엠엡엣엥여역엮연열엶엷염엽엾엿였영옅옆옇예옌옐옘옙옛옜오옥온올옭옮옰옳옴옵옷옹옻와왁완왈왐왑왓왔왕왜왝왠왬왯왱외왹왼욀욈욉욋욍요욕욘욜욤욥욧용욱운욹우욱운울욺움웁웃웅워웍원월웜웝웠웡웨웩웬웰웸웹웽위윅윈윌윔윕윗윙유육윤율윰윱윳융윷으윽은을읊음읍읏응읒읓읔읕읖읗의읜읠읨읫이익인일읽읾잃임입잇있잉잊잎자작잔잖잗잘잚잠잡잣잤장잦재잭잰잴잼잽잿쟀쟁쟈쟉쟌쟎쟐쟘쟝쟤쟨쟬저적전절젊점접젓정젖제젝젠젤젬젭젯젱져젼졀졈졉졌졍졔조족존졸졺좀좁종좆좇좋좌좍좔좝좟좡좨좼좽죄죈죌죔죕죗죙죠죡죤죵주죽준줄줅줆줌줍줏중줘줬줴쥐쥑쥔쥘쥠쥡쥣쥬쥰쥴쥼즈즉즌즐즘즙즛증지직진짇질짊짐집짓징짖짙짚짜짝짠짢짤짧짬짭짯짰짱째짹짼쨀쨈쨉쨋쨌쨍쨔쨘쨩쩌쩍쩐쩔쩜쩝쩟쩠쩡쩨쩽쪄쪘쪼쫀쫄쫌쫍쫏쫑쫓쫘쫙쫠쫬쫴쬈쬐쬔쬘쬠쬡쭁쭈쭉쭌쭐쭘쭙쭝쭤쭸쭹쮜쮸쯔쯤쯧쯩찌찍찐찔찜찝찡찢찧차착찬찮찰참찹찻찼창찾채책챈챌챔챕챗챘챙챠챤챦챨챰챵처척천철첨첩첫첬청체첵첸첼쳄쳅쳇쳉쳐쳔쳤쳬쳰촁초촉촌촐촘촙촛총촤촨촬촹최쵠쵤쵬쵭쵯쵱쵸춈추축춘출춤춥춧충춰췄췌췐취췬췰췸췹췻췽츄츈츌츔츙츠측츤츨츰츱츳층치칙친칟칠칡침칩칫칭카칵칸칼캄캅캇캉캐캑캔캘캠캡캣캤캥캬캭컁커컥컨컫컬컴컵컷컸컹케켁켄켈켐켑켓켕켜켠켤켬켭켯켰켱켸코콕콘콜콤콥콧콩콰콱콴콸쾀쾅쾌쾡쾨쾰쿄쿠쿡쿤쿨쿰쿱쿳쿵쿼퀀퀄퀑퀘퀭퀴퀵퀸퀼큄큅큇큉큐큔큘큠크큭큰클큼큽킁키킥킨킬킴킵킷킹타탁탄탈탉탐탑탓탔탕태택탠탤탬탭탯탰탱탸턍터턱턴털턺텀텁텃텄텅테텍텐텔템텝텟텡텨텬텼톄톈토톡톤톨톰톱톳통톺톼퇀퇘퇴퇸툇툉툐투툭툰툴툼툽툿퉁퉈퉜퉤튀튁튄튈튐튑튕튜튠튤튬튱트특튼튿틀틂틈틉틋틔틘틜틤틥티틱틴틸팀팁팃팅파팍팎판팔팖팜팝팟팠팡팥패팩팬팰팸팹팻팼팽퍄퍅퍼퍽펀펄펌펍펏펐펑페펙펜펠펨펩펫펭펴편펼폄폅폈평폐폘폡폣포폭폰폴폼폽폿퐁퐈퐝푀푄표푠푤푭푯푸푹푼푿풀풂품풉풋풍풔풩퓌퓐퓔퓜퓟퓨퓬퓰퓸퓻퓽프픈플픔픕픗피픽핀필핌핍핏핑하학한할핥함합핫항해핵핸핼햄햅햇했행햐향허헉헌헐헒험헙헛헝헤헥헨헬헴헵헷헹혀혁현혈혐협혓혔형혜혠혤혭호혹혼홀홅홈홉홋홍홑화확환활홧황홰홱홴횃횅회획횐횔횝횟횡효횬횰횹횻후훅훈훌훑훔훗훙훠훤훨훰훵훼훽휀휄휑휘휙휜휠휨휩휫휭휴휵휸휼흄흇흉흐흑흔흖흗흘흙흠흡흣흥흩희흰흴흼흽힁히힉힌힐힘힙힛힝
        """
        
        for char in common_korean:
            if char not in ' \n\t':
                characters.add(char)
        
        # 3. 통계 관련 특수 기호
        special_chars = "±×÷≤≥≠≈∞∑∏∫√∂∆αβγδεζηθικλμνξοπρστυφχψωΣΦΩ"
        for char in special_chars:
            characters.add(char)
        
        # 4. 화살표 및 기타 기호
        arrows = "←→↑↓↔↕⇐⇒⇑⇓⇔⇕"
        for char in arrows:
            characters.add(char)
        
        print(f"총 {len(characters)}개 문자 포함")
        return ''.join(sorted(characters))
    
    def create_subset(self, font_path, characters):
        """폰트 서브셋 생성"""
        output_path = self.output_dir / f"{font_path.stem}-subset.woff2"
        
        # fonttools subset 명령어 구성
        args = [
            str(font_path),
            f"--text={characters}",
            "--layout-features=*",
            "--flavor=woff2",
            f"--output-file={output_path}"
        ]
        
        # 서브셋 생성
        subset.main(args)
        
        # 파일 크기 확인
        original_size = font_path.stat().st_size / 1024
        subset_size = output_path.stat().st_size / 1024
        reduction = (1 - subset_size / original_size) * 100
        
        print(f"  원본: {original_size:.1f}KB → 서브셋: {subset_size:.1f}KB ({reduction:.1f}% 감소)")
        
        return output_path
    
    def encode_to_base64(self, font_path):
        """폰트를 Base64로 인코딩"""
        with open(font_path, 'rb') as f:
            font_data = f.read()
        
        encoded = base64.b64encode(font_data).decode('ascii')
        return encoded
    
    def generate_css(self, fonts_base64):
        """CSS 스타일 생성"""
        css = """
/* Pretendard 한글 폰트 - 서브셋 */
@font-face {
    font-family: 'Pretendard';
    font-weight: 400;
    font-style: normal;
    font-display: swap;
    src: url('data:font/woff2;base64,%s') format('woff2');
}

@font-face {
    font-family: 'Pretendard';
    font-weight: 700;
    font-style: normal;
    font-display: swap;
    src: url('data:font/woff2;base64,%s') format('woff2');
}

/* 폰트 적용 */
:root {
    --font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                 'Malgun Gothic', '맑은 고딕', sans-serif;
}

body {
    font-family: var(--font-sans);
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
}

/* 숫자는 고정폭으로 */
.stat-value, 
.number {
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';
}
""" % (fonts_base64['regular'], fonts_base64['bold'])
        
        return css
    
    def build(self):
        """전체 빌드 프로세스"""
        print("=== 한글 폰트 서브셋 생성 시작 ===\n")
        
        # 1. 폰트 다운로드
        print("1. 폰트 다운로드")
        fonts = self.download_font()
        if not fonts:
            print("폰트 다운로드 실패")
            return None
        
        # 2. 필요한 문자 집합 정의
        print("\n2. 문자 집합 정의")
        characters = self.get_required_characters()
        
        # 3. 서브셋 생성
        print("\n3. 서브셋 생성")
        subset_fonts = {}
        for weight, font_path in fonts.items():
            print(f"처리 중: {weight}")
            subset_path = self.create_subset(font_path, characters)
            subset_fonts[weight] = subset_path
        
        # 4. Base64 인코딩
        print("\n4. Base64 인코딩")
        fonts_base64 = {}
        total_size = 0
        for weight, font_path in subset_fonts.items():
            encoded = self.encode_to_base64(font_path)
            fonts_base64[weight] = encoded
            size_kb = len(encoded) / 1024
            total_size += size_kb
            print(f"  {weight}: {size_kb:.1f}KB (Base64)")
        
        print(f"\n총 Base64 크기: {total_size:.1f}KB ({total_size/1024:.2f}MB)")
        
        # 5. CSS 생성
        css_content = self.generate_css(fonts_base64)
        
        # 6. 결과 저장
        output_data = {
            "fonts": fonts_base64,
            "css": css_content,
            "characters": characters,
            "total_size_kb": total_size
        }
        
        # JSON으로 저장 (나중에 HTML에 포함시킬 용도)
        output_path = self.output_dir / "font_bundle.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ 폰트 번들 생성 완료: {output_path}")
        
        # CSS 파일도 별도 저장
        css_path = self.output_dir / "fonts.css"
        css_path.write_text(css_content, encoding='utf-8')
        print(f"✅ CSS 파일 생성: {css_path}")
        
        return output_data

if __name__ == "__main__":
    # fontTools 설치 확인
    try:
        import fontTools
    except ImportError:
        print("fontTools가 설치되지 않았습니다.")
        print("설치 명령: pip install fonttools")
        sys.exit(1)
    
    subsetter = FontSubsetter()
    result = subsetter.build()
    
    if result:
        print(f"\n=== 완료 ===")
        print(f"폰트 크기: {result['total_size_kb']/1024:.2f}MB")
        print(f"포함된 문자 수: {len(result['characters'])}개")