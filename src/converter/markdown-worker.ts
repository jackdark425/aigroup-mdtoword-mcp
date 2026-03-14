import MarkdownIt from 'markdown-it';
import { MarkdownConverter } from '../types/index.js';
import { StyleConfig, StyleContext, TextStyle, ParagraphStyle, HeadingStyle } from '../types/style.js';
import { styleEngine } from '../utils/styleEngine.js';
import { WatermarkProcessor } from '../utils/watermarkProcessor.js';
import { TOCGenerator } from '../utils/tocGenerator.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { TableBuilder } from '../utils/tableBuilder.js';
import { MathProcessor } from '../utils/mathProcessor.js';
import { TableData } from '../types/style.js';

// 使用新版docx API
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  AlignmentType,
  Header,
  Footer,
  SimpleField,
  NumberFormat,
  TableOfContents
} from 'docx';

export class DocxMarkdownConverterWorker implements MarkdownConverter {
  private md: MarkdownIt;
  private effectiveStyleConfig: StyleConfig;
  private errorHandler: ErrorHandler;
  private tocGenerator: TOCGenerator;
  private mathProcessor: MathProcessor;

  constructor(styleConfig?: StyleConfig) {
    const constructorStartTime = Date.now();
    console.log(`🚀 [转换器-Worker版] 开始初始化 - ${new Date().toISOString()}`);
    
    // 初始化错误处理器
    this.errorHandler = new ErrorHandler();
    
    // 初始化目录生成器
    this.tocGenerator = new TOCGenerator();
    
    // 初始化数学公式处理器
    this.mathProcessor = new MathProcessor();
    
    const mdInitStartTime = Date.now();
    this.md = new MarkdownIt({
      html: true,  // 启用HTML标签处理
      xhtmlOut: true,
      breaks: true,
      typographer: true
    });
    console.log(`⏱️ [转换器-Worker版] MarkdownIt初始化耗时: ${Date.now() - mdInitStartTime}ms`);
    
    // 使用样式引擎获取有效的样式配置
    const styleEngineStartTime = Date.now();
    this.effectiveStyleConfig = styleEngine.getEffectiveStyleConfig(styleConfig);
    console.log(`⏱️ [转换器-Worker版] 样式引擎处理耗时: ${Date.now() - styleEngineStartTime}ms`);
    
    // 验证样式配置
    const validationStartTime = Date.now();
    const validation = styleEngine.validateStyleConfig(this.effectiveStyleConfig);
    console.log(`⏱️ [转换器-Worker版] 样式配置验证耗时: ${Date.now() - validationStartTime}ms`);
    
    if (!validation.valid && validation.errors) {
      console.warn('❌ 样式配置验证失败:', validation.errors);
      validation.errors.forEach(err => {
        this.errorHandler.addError('STYLE_VALIDATION', err);
      });
    }
    if (validation.warnings) {
      console.warn('⚠️ 样式配置警告:', validation.warnings);
      validation.warnings.forEach(warn => {
        this.errorHandler.addWarning('STYLE_WARNING', warn);
      });
    }
    if (validation.suggestions) {
      console.info('💡 样式配置建议:', validation.suggestions);
    }
    
    // 打印缓存统计
    const cacheStats = styleEngine.getCacheStats();
    console.log(`📊 [缓存统计] 命中率: ${cacheStats.hitRate}, 大小: ${cacheStats.size}`);
    
    const constructorTime = Date.now() - constructorStartTime;
    console.log(`🏁 [转换器-Worker版] 初始化完成，总耗时: ${constructorTime}ms`);
  }

  async convert(markdown: string): Promise<Buffer> {
    const convertStartTime = Date.now();
    console.log(`🚀 [转换器-Worker版] 开始转换，Markdown长度: ${markdown.length} 字符`);
    
    // 预处理数学公式
    const mathStartTime = Date.now();
    const { processed, mathBlocks } = this.mathProcessor.processMathInMarkdown(markdown);
    const mathTime = Date.now() - mathStartTime;
    console.log(`🧮 [数学公式] 预处理耗时: ${mathTime}ms，找到 ${mathBlocks.length} 个数学公式`);
    
    const parseStartTime = Date.now();
    const tokens = this.md.parse(processed, {});
    const parseTime = Date.now() - parseStartTime;
    console.log(`⏱️ [转换器-Worker版] Markdown解析耗时: ${parseTime}ms，生成 ${tokens.length} 个token`);
    
    // 如果启用了目录，提取标题
    if (this.effectiveStyleConfig.tableOfContents?.enabled) {
      const headings = this.tocGenerator.extractHeadings(markdown);
      console.log(`📑 [目录] 提取到 ${headings.length} 个标题`);
    }
    
    const docCreateStartTime = Date.now();
    const doc = await this.createDocument(tokens, mathBlocks);
    const docCreateTime = Date.now() - docCreateStartTime;
    console.log(`⏱️ [转换器-Worker版] 文档创建耗时: ${docCreateTime}ms`);
    
    // 打印错误处理统计
    if (this.errorHandler.hasErrors() || this.errorHandler.hasWarnings()) {
      console.log(`\n⚠️ [转换警告]`);
      this.errorHandler.printAll();
    }
    
    const packStartTime = Date.now();
    const buffer = await Packer.toBuffer(doc);
    const packTime = Date.now() - packStartTime;
    console.log(`⏱️ [转换器-Worker版] 文档打包耗时: ${packTime}ms，生成文件大小: ${buffer.length} 字节`);
    
    const totalConvertTime = Date.now() - convertStartTime;
    console.log(`🏁 [转换器-Worker版] 转换完成，总耗时: ${totalConvertTime}ms`);
    
    return buffer;
  }

  private async createDocument(tokens: any[], mathBlocks?: Array<{latex: string; startIndex: number; endIndex: number; inline: boolean}>): Promise<Document> {
    let children = await this.processTokens(tokens, mathBlocks);
    const docStyle = this.effectiveStyleConfig.document;
    
    // 如果启用目录，在内容前插入目录
    if (this.effectiveStyleConfig.tableOfContents?.enabled) {
      const tocConfig = this.effectiveStyleConfig.tableOfContents;
      const tocElements: Paragraph[] = [];
      
      // 添加目录标题
      tocElements.push(TOCGenerator.createTOCTitle(tocConfig));
      
      // 添加目录
      tocElements.push(TOCGenerator.createTOC(tocConfig) as any);
      
      // 添加分页符
      tocElements.push(new Paragraph({
        text: '',
        pageBreakBefore: true
      }));
      
      children = [...tocElements, ...children];
      console.log(`📑 [目录] 已添加目录到文档`);
    }
    
    // 准备节配置
    const sectionConfig: any = {
      properties: {
        page: {
          size: this.getPageSize(),
          margin: this.getPageMargins(),
          // 添加页码配置
          pageNumbers: this.effectiveStyleConfig.headerFooter ? {
            start: this.effectiveStyleConfig.headerFooter.pageNumberStart || 1,
            formatType: this.getPageNumberFormat(this.effectiveStyleConfig.headerFooter.pageNumberFormatType)
          } : undefined
        },
        // 添加首页不同和奇偶页不同配置
        titlePage: this.effectiveStyleConfig.headerFooter?.differentFirstPage || false,
        differentOddAndEven: this.effectiveStyleConfig.headerFooter?.differentOddEven || false
      },
      children: children
    };

    // 添加页眉
    if (this.effectiveStyleConfig.headerFooter?.header ||
        this.effectiveStyleConfig.headerFooter?.firstPageHeader ||
        this.effectiveStyleConfig.headerFooter?.evenPageHeader) {
      sectionConfig.headers = {};
      
      // 默认页眉（奇数页）
      if (this.effectiveStyleConfig.headerFooter.header) {
        sectionConfig.headers.default = this.createHeaderFromConfig(this.effectiveStyleConfig.headerFooter.header);
      }
      
      // 首页页眉
      if (this.effectiveStyleConfig.headerFooter.firstPageHeader && this.effectiveStyleConfig.headerFooter.differentFirstPage) {
        sectionConfig.headers.first = this.createHeaderFromConfig(this.effectiveStyleConfig.headerFooter.firstPageHeader);
      }
      
      // 偶数页页眉
      if (this.effectiveStyleConfig.headerFooter.evenPageHeader && this.effectiveStyleConfig.headerFooter.differentOddEven) {
        sectionConfig.headers.even = this.createHeaderFromConfig(this.effectiveStyleConfig.headerFooter.evenPageHeader);
      }
    }

    // 添加页脚
    if (this.effectiveStyleConfig.headerFooter?.footer ||
        this.effectiveStyleConfig.headerFooter?.firstPageFooter ||
        this.effectiveStyleConfig.headerFooter?.evenPageFooter) {
      sectionConfig.footers = {};
      
      // 默认页脚（奇数页）
      if (this.effectiveStyleConfig.headerFooter.footer) {
        sectionConfig.footers.default = this.createFooterFromConfig(this.effectiveStyleConfig.headerFooter.footer);
      }
      
      // 首页页脚
      if (this.effectiveStyleConfig.headerFooter.firstPageFooter && this.effectiveStyleConfig.headerFooter.differentFirstPage) {
        sectionConfig.footers.first = this.createFooterFromConfig(this.effectiveStyleConfig.headerFooter.firstPageFooter);
      }
      
      // 偶数页页脚
      if (this.effectiveStyleConfig.headerFooter.evenPageFooter && this.effectiveStyleConfig.headerFooter.differentOddEven) {
        sectionConfig.footers.even = this.createFooterFromConfig(this.effectiveStyleConfig.headerFooter.evenPageFooter);
      }
    }

    // 准备文档配置
    const docConfig: any = {
      styles: {
        default: {
          document: {
            run: {
              font: docStyle?.defaultFont || "宋体",
              size: docStyle?.defaultSize || 24,
              color: docStyle?.defaultColor || "000000"
            }
          },
          heading1: this.createDocxHeadingStyle(1),
          heading2: this.createDocxHeadingStyle(2),
          heading3: this.createDocxHeadingStyle(3),
          heading4: this.createDocxHeadingStyle(4),
          heading5: this.createDocxHeadingStyle(5),
          heading6: this.createDocxHeadingStyle(6)
        }
      },
      sections: [sectionConfig]
    };

    // 添加水印
    if (this.effectiveStyleConfig.watermark) {
      docConfig.background = WatermarkProcessor.createWatermark(this.effectiveStyleConfig.watermark);
    }

    return new Document(docConfig);
  }

  /**
   * 创建页眉（从配置对象）
   */
  private createHeaderFromConfig(headerConfig: any): Header {
    if (!headerConfig) {
      return new Header({
        children: []
      });
    }

    const alignment = headerConfig.alignment === 'both' ? AlignmentType.BOTH :
                     headerConfig.alignment === 'center' ? AlignmentType.CENTER :
                     headerConfig.alignment === 'right' ? AlignmentType.RIGHT :
                     AlignmentType.LEFT;

    const children: any[] = [];
    
    if (headerConfig.content) {
      children.push(new TextRun({
        text: headerConfig.content,
        ...this.convertTextStyleToDocx(headerConfig.textStyle || {})
      }));
    }

    return new Header({
      children: [
        new Paragraph({
          children: children,
          alignment: alignment,
          border: headerConfig.border?.bottom ? {
            bottom: {
              style: headerConfig.border.bottom.style === 'dash' ? 'dashed' : headerConfig.border.bottom.style,
              size: headerConfig.border.bottom.size,
              color: headerConfig.border.bottom.color
            }
          } : undefined
        })
      ]
    });
  }

  /**
   * 创建页脚（从配置对象）
   */
  private createFooterFromConfig(footerConfig: any): Footer {
    if (!footerConfig) {
      return new Footer({
        children: []
      });
    }

    const alignment = footerConfig.alignment === 'both' ? AlignmentType.BOTH :
                     footerConfig.alignment === 'center' ? AlignmentType.CENTER :
                     footerConfig.alignment === 'right' ? AlignmentType.RIGHT :
                     AlignmentType.LEFT;

    const children: Paragraph[] = [];

    // 添加页脚内容
    if (footerConfig.showPageNumber) {
      // 使用SimpleField（Word域代码）方式实现页码
      const paragraphChildren: (TextRun | SimpleField)[] = [];

      // 添加页脚前缀文本
      if (footerConfig.content) {
        paragraphChildren.push(new TextRun({
          text: footerConfig.content,
          ...this.convertTextStyleToDocx(footerConfig.textStyle || {})
        }));
      }

      // 添加当前页码（使用PAGE域代码）
      paragraphChildren.push(new SimpleField("PAGE"));

      // 如果需要显示总页数，使用完整格式：页码后缀 + 连接文本 + 总页数 + 结束文本
      if (footerConfig.showTotalPages && footerConfig.totalPagesFormat) {
        // 添加页码后缀文本（与总页数连接文本合并）
        if (footerConfig.pageNumberFormat) {
          paragraphChildren.push(new TextRun({
            text: footerConfig.pageNumberFormat + footerConfig.totalPagesFormat,
            ...this.convertTextStyleToDocx(footerConfig.textStyle || {})
          }));
        } else {
          // 如果没有页码后缀格式，使用总页数连接文本
          paragraphChildren.push(new TextRun({
            text: footerConfig.totalPagesFormat,
            ...this.convertTextStyleToDocx(footerConfig.textStyle || {})
          }));
        }
        // 添加总页数（使用NUMPAGES域代码）
        paragraphChildren.push(new SimpleField("NUMPAGES"));
      } else {
        // 不显示总页数时，只添加页码后缀文本
        if (footerConfig.pageNumberFormat) {
          paragraphChildren.push(new TextRun({
            text: footerConfig.pageNumberFormat,
            ...this.convertTextStyleToDocx(footerConfig.textStyle || {})
          }));
        }
      }
      
      console.log(`📄 [页脚] 使用SimpleField创建页码，元素数量: ${paragraphChildren.length}`);
      
      children.push(new Paragraph({
        children: paragraphChildren,
        alignment: alignment,
        border: footerConfig.border?.top ? {
          top: {
            style: footerConfig.border.top.style === 'dash' ? 'dashed' : footerConfig.border.top.style,
            size: footerConfig.border.top.size,
            color: footerConfig.border.top.color
          }
        } : undefined
      }));
    } else if (footerConfig.content) {
      children.push(new Paragraph({
        children: [
          new TextRun({
            text: footerConfig.content,
            ...this.convertTextStyleToDocx(footerConfig.textStyle || {})
          })
        ],
        alignment: alignment,
        border: footerConfig.border?.top ? {
          top: {
            style: footerConfig.border.top.style === 'dash' ? 'dashed' : footerConfig.border.top.style,
            size: footerConfig.border.top.size,
            color: footerConfig.border.top.color
          }
        } : undefined
      }));
    }

    // 如果children为空，至少添加一个空段落（防止Word无法显示页脚区域）
    if (children.length === 0) {
      children.push(new Paragraph({
        children: [],
        alignment: alignment
      }));
    }

    console.log(`📄 [页脚创建] 页脚Paragraph数量: ${children.length}`);
    const footer = new Footer({
      children: children
    });
    console.log(`📄 [页脚创建] Footer对象创建成功`);
    return footer;
  }

  /**
   * 创建 DOCX 标题样式
   */
  private createDocxHeadingStyle(level: 1|2|3|4|5|6): any {
    const headingKey = `h${level}` as keyof typeof this.effectiveStyleConfig.headingStyles;
    const headingStyles = this.effectiveStyleConfig.headingStyles;
    const headingStyle = headingStyles?.[headingKey] as HeadingStyle | undefined;
    
    if (!headingStyle) {
      return {};
    }

    return {
      run: {
        font: headingStyle.font,
        size: headingStyle.size,
        bold: headingStyle.bold,
        italic: headingStyle.italic,
        color: headingStyle.color
      },
      paragraph: {
        spacing: {
          before: headingStyle.spacing?.before,
          after: headingStyle.spacing?.after,
          line: headingStyle.spacing?.line
        },
        alignment: headingStyle.alignment,
        indent: {
          left: headingStyle.indent?.left,
          right: headingStyle.indent?.right,
          firstLine: headingStyle.indent?.firstLine,
          hanging: headingStyle.indent?.hanging
        }
      }
    };
  }

  /**
   * 获取页面大小
   */
  private getPageSize(): any {
    const pageSize = this.effectiveStyleConfig.document?.page?.size || 'A4';
    const orientation = this.getPageOrientation();
    const sizeMap = {
      'A4': { width: 11906, height: 16838 },
      'A3': { width: 16838, height: 23811 },
      'Letter': { width: 12240, height: 15840 },
      'Legal': { width: 12240, height: 20160 }
    };
    const size = sizeMap[pageSize] || sizeMap['A4'];
    return orientation === 'landscape'
      ? { width: size.height, height: size.width }
      : size;
  }

  /**
   * 获取页面方向
   */
  private getPageOrientation(): string {
    return this.effectiveStyleConfig.document?.page?.orientation || 'portrait';
  }

  /**
   * 获取页码格式
   */
  private getPageNumberFormat(formatType?: string) {
    // NumberFormat 枚举值映射
    const formatMap: Record<string, any> = {
      'decimal': NumberFormat.DECIMAL,
      'upperRoman': NumberFormat.UPPER_ROMAN,
      'lowerRoman': NumberFormat.LOWER_ROMAN,
      'upperLetter': NumberFormat.UPPER_LETTER,
      'lowerLetter': NumberFormat.LOWER_LETTER
    };
    return formatMap[formatType || 'decimal'] || NumberFormat.DECIMAL;
  }

  /**
   * 获取页边距
   */
  private getPageMargins(): any {
    const margins = this.effectiveStyleConfig.document?.page?.margins;
    return {
      top: margins?.top || 1440,
      bottom: margins?.bottom || 1440,
      left: margins?.left || 1440,
      right: margins?.right || 1440
    };
  }

  private async processTokens(tokens: any[], mathBlocks?: Array<{latex: string; startIndex: number; endIndex: number; inline: boolean}>): Promise<any[]> {
    const children: any[] = [];
    let currentListItems: Paragraph[] = [];
    let inList = false;
    let listLevel = 0;
    let orderedList = false;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      switch (token.type) {
        case 'heading_open':
          const level = parseInt(token.tag.slice(1)) as 1|2|3|4|5|6;
          const headingContent = await this.processInlineContentAsync(tokens[i + 1], level, mathBlocks);
          children.push(this.createHeading(headingContent as TextRun[], level));
          i++; // Skip the next token
          break;

        case 'paragraph_open':
          const paragraphContent = await this.processInlineContentAsync(tokens[i + 1], undefined, mathBlocks);
          // 如果段落包含图片，需要特殊处理
          if (paragraphContent.some(item => item instanceof ImageRun)) {
            children.push(this.createParagraphWithImages(paragraphContent));
          } else {
            children.push(this.createParagraph(paragraphContent as TextRun[]));
          }
          i++; // Skip the next token
          break;

        case 'bullet_list_open':
          inList = true;
          orderedList = false;
          break;

        case 'ordered_list_open':
          inList = true;
          orderedList = true;
          break;

        case 'bullet_list_close':
        case 'ordered_list_close':
          if (currentListItems.length > 0) {
            children.push(...currentListItems);
            currentListItems = [];
          }
          inList = false;
          listLevel = 0;
          break;

        case 'list_item_open':
          listLevel = (token.attrs && token.attrs.find((attr: any[]) => attr[0] === 'level')?.[1]) || 0;
          const itemContent = await this.processInlineContentAsync(tokens[i + 2], undefined, mathBlocks);
          const listItem = this.createListItem(itemContent as TextRun[], orderedList, listLevel);
          if (inList) {
            currentListItems.push(listItem);
          }
          i += 2; // Skip content tokens
          break;

        case 'table_open':
          const tableData = await this.extractTableData(tokens, i, mathBlocks);
          children.push(this.createTable(tableData.rows));
          i = tableData.endIndex;
          break;

        case 'blockquote_open':
          const quoteTokens = [];
          i++;
          while (i < tokens.length && tokens[i].type !== 'blockquote_close') {
            quoteTokens.push(tokens[i]);
            i++;
          }
          const blockquoteContent = await this.processInlineContentAsync(tokens.find(t => t.type === 'inline') || { content: '' }, undefined, mathBlocks);
          children.push(this.createBlockquote(blockquoteContent as TextRun[]));
          break;

        case 'fence':
          children.push(this.createCodeBlock(token.content, token.info));
          break;
          
        case 'image':
          console.log(`\n📸 [Token处理] 发现图片token`);
          // 在Worker环境中，跳过图片处理以避免fs依赖问题
          console.log(`   ⚠️ [Worker版] 图片处理被跳过以兼容Cloudflare环境`);
          break;
          
        case 'html_block':
          console.log(`\n📄 [Token处理] 发现HTML块`);
          // 在Worker环境中，跳过HTML中的图片处理以避免fs依赖问题
          console.log(`   ⚠️ [Worker版] HTML图片处理被跳过以兼容Cloudflare环境`);
          break;
      }
    }

    return children;
  }


  private async processInlineContentAsync(token: any, headingLevel?: number, mathBlocks?: Array<{latex: string; startIndex: number; endIndex: number; inline: boolean}>): Promise<(TextRun | ImageRun | any)[]> {
    const runs: (TextRun | ImageRun | any)[] = [];
    
    for (const child of token.children) {
      const baseStyle = this.getTextStyle(headingLevel);
      
      switch (child.type) {
        case 'text':
          // 检查是否包含数学公式占位符
          const text = child.content;
          const mathPlaceholderRegex = /\[MATH_(BLOCK|INLINE)_(\d+)\]/g;
          let lastIndex = 0;
          let mathMatch;
          
          while ((mathMatch = mathPlaceholderRegex.exec(text)) !== null) {
            // 添加占位符前的文本
            if (mathMatch.index > lastIndex) {
              const beforeText = text.substring(lastIndex, mathMatch.index);
              const textParts = beforeText.split(/\\n/);
              textParts.forEach((part: string, index: number) => {
                if (part) {
                  runs.push(new TextRun({
                    text: part,
                    ...this.convertTextStyleToDocx(baseStyle)
                  }));
                }
                if (index < textParts.length - 1) {
                  runs.push(new TextRun({
                    text: '',
                    break: 1,
                    ...this.convertTextStyleToDocx(baseStyle)
                  }));
                }
              });
            }
            
            // 处理数学公式
            const mathIndex = parseInt(mathMatch[2]);
            const isInline = mathMatch[1] === 'INLINE';
            if (mathBlocks && mathBlocks[mathIndex]) {
              const mathBlock = mathBlocks[mathIndex];
              const mathObj = this.mathProcessor.convertLatexToDocx(mathBlock.latex, { inline: isInline });
              if (mathObj) {
                console.log(`🧮 [数学公式] ${isInline ? '行内' : '行间'}公式已转换: ${mathBlock.latex}`);
                console.log(`   - Math对象类型: ${mathObj.constructor.name}`);
                console.log(`   - Math对象: ${JSON.stringify(mathObj, null, 2).substring(0, 200)}...`);
                runs.push(mathObj);
                console.log(`   - 已添加到runs数组，当前runs长度: ${runs.length}`);
              } else {
                console.warn(`   ⚠️ 数学公式转换失败，返回null`);
              }
            }
            
            lastIndex = mathMatch.index + mathMatch[0].length;
          }
          
          // 添加剩余文本
          if (lastIndex < text.length) {
            const remainingText = text.substring(lastIndex);
            const textParts = remainingText.split(/\\n/);
            textParts.forEach((part: string, index: number) => {
              if (part) {
                runs.push(new TextRun({
                  text: part,
                  ...this.convertTextStyleToDocx(baseStyle)
                }));
              }
              if (index < textParts.length - 1) {
                runs.push(new TextRun({
                  text: '',
                  break: 1,
                  ...this.convertTextStyleToDocx(baseStyle)
                }));
              }
            });
          }
          break;
        case 'strong':
          const strongStyle = this.mergeTextStyles(baseStyle, this.effectiveStyleConfig.emphasisStyles?.strong || { bold: true });
          runs.push(new TextRun({
            text: child.content,
            ...this.convertTextStyleToDocx(strongStyle)
          }));
          break;
        case 'em':
          const emStyle = this.mergeTextStyles(baseStyle, this.effectiveStyleConfig.emphasisStyles?.emphasis || { italic: true });
          runs.push(new TextRun({
            text: child.content,
            ...this.convertTextStyleToDocx(emStyle)
          }));
          break;
        case 'code_inline':
          const codeStyle = this.mergeTextStyles(baseStyle, this.effectiveStyleConfig.inlineCodeStyle || {});
          runs.push(new TextRun({
            text: child.content,
            ...this.convertTextStyleToDocx(codeStyle)
          }));
          break;
        case 'image':
          console.log(`\n📸 [Inline处理] 发现内联图片`);
          // 在Worker环境中，跳过图片处理以避免fs依赖问题
          console.log(`   ⚠️ [Worker版] 内联图片处理被跳过以兼容Cloudflare环境`);
          break;
          
        case 'html_inline':
          console.log(`\n📄 [Inline处理] 发现内联HTML`);
          // 在Worker环境中，跳过HTML中的图片处理以避免fs依赖问题
          console.log(`   ⚠️ [Worker版] HTML内联图片处理被跳过以兼容Cloudflare环境`);
          break;
      }
    }

    return runs;
  }

  /**
   * 获取文本样式
   */
  private getTextStyle(headingLevel?: number): TextStyle {
    if (headingLevel) {
      const headingKey = `h${headingLevel}` as keyof typeof this.effectiveStyleConfig.headingStyles;
      const headingStyle = this.effectiveStyleConfig.headingStyles?.[headingKey] as HeadingStyle | undefined;
      if (headingStyle) {
        return {
          font: headingStyle.font,
          size: headingStyle.size,
          color: headingStyle.color,
          bold: headingStyle.bold,
          italic: headingStyle.italic,
          underline: headingStyle.underline,
          strike: headingStyle.strike
        };
      }
    }
    
    const normalStyle = this.effectiveStyleConfig.paragraphStyles?.normal;
    return {
      font: normalStyle?.font || this.effectiveStyleConfig.document?.defaultFont,
      size: normalStyle?.size || this.effectiveStyleConfig.document?.defaultSize,
      color: normalStyle?.color || this.effectiveStyleConfig.document?.defaultColor,
      bold: normalStyle?.bold,
      italic: normalStyle?.italic,
      underline: normalStyle?.underline,
      strike: normalStyle?.strike
    };
  }

  /**
   * 合并文本样式
   */
  private mergeTextStyles(base: TextStyle, override: TextStyle): TextStyle {
    return {
      font: override.font || base.font,
      size: override.size || base.size,
      color: override.color || base.color,
      bold: override.bold !== undefined ? override.bold : base.bold,
      italic: override.italic !== undefined ? override.italic : base.italic,
      underline: override.underline !== undefined ? override.underline : base.underline,
      strike: override.strike !== undefined ? override.strike : base.strike
    };
  }

  /**
   * 将文本样式转换为 DOCX 格式
   */
  private convertTextStyleToDocx(style: TextStyle): any {
    return {
      font: style.font,
      size: style.size,
      color: style.color,
      bold: style.bold,
      italics: style.italic,
      underline: style.underline ? {} : undefined,
      strike: style.strike
    };
  }

  private createHeading(content: TextRun[], level: 1|2|3|4|5|6): Paragraph {
    const headingLevels = {
      1: HeadingLevel.HEADING_1,
      2: HeadingLevel.HEADING_2,
      3: HeadingLevel.HEADING_3,
      4: HeadingLevel.HEADING_4,
      5: HeadingLevel.HEADING_5,
      6: HeadingLevel.HEADING_6,
    };

    const headingKey = `h${level}` as keyof typeof this.effectiveStyleConfig.headingStyles;
    const headingStyle = this.effectiveStyleConfig.headingStyles?.[headingKey] as HeadingStyle | undefined;

    return new Paragraph({
      heading: headingLevels[level],
      children: content,
      spacing: {
        before: headingStyle?.spacing?.before || 240,
        after: headingStyle?.spacing?.after || 120,
        line: headingStyle?.spacing?.line || 360
      },
      alignment: headingStyle?.alignment === "justify" ? "both" : headingStyle?.alignment,
      indent: {
        left: headingStyle?.indent?.left,
        right: headingStyle?.indent?.right,
        firstLine: headingStyle?.indent?.firstLine,
        hanging: headingStyle?.indent?.hanging
      }
    });
  }

  private createParagraph(content: TextRun[]): Paragraph {
    const normalStyle = this.effectiveStyleConfig.paragraphStyles?.normal;
    
    return new Paragraph({
      children: content,
      spacing: {
        before: normalStyle?.spacing?.before,
        after: normalStyle?.spacing?.after,
        line: normalStyle?.spacing?.line || 360
      },
      alignment: normalStyle?.alignment === "justify" ? "both" : normalStyle?.alignment,
      indent: {
        left: normalStyle?.indent?.left,
        right: normalStyle?.indent?.right,
        firstLine: normalStyle?.indent?.firstLine,
        hanging: normalStyle?.indent?.hanging
      },
      border: normalStyle?.border ? {
        top: normalStyle.border.top ? {
          style: normalStyle.border.top.style === "dash" ? "dashed" : normalStyle.border.top.style,
          size: normalStyle.border.top.size,
          color: normalStyle.border.top.color
        } : undefined,
        bottom: normalStyle.border.bottom ? {
          style: normalStyle.border.bottom.style === "dash" ? "dashed" : normalStyle.border.bottom.style,
          size: normalStyle.border.bottom.size,
          color: normalStyle.border.bottom.color
        } : undefined,
        left: normalStyle.border.left ? {
          style: normalStyle.border.left.style === "dash" ? "dashed" : normalStyle.border.left.style,
          size: normalStyle.border.left.size,
          color: normalStyle.border.left.color
        } : undefined,
        right: normalStyle.border.right ? {
          style: normalStyle.border.right.style === "dash" ? "dashed" : normalStyle.border.right.style,
          size: normalStyle.border.right.size,
          color: normalStyle.border.right.color
        } : undefined
      } : undefined,
      shading: normalStyle?.shading ? {
        fill: normalStyle.shading.fill,
        type: normalStyle.shading.type,
        color: normalStyle.shading.color
      } : undefined
    });
  }

  private createListItem(content: TextRun[], ordered: boolean, level: number): Paragraph {
    const listStyle = ordered ?
      this.effectiveStyleConfig.listStyles?.ordered :
      this.effectiveStyleConfig.listStyles?.bullet;

    return new Paragraph({
      bullet: ordered ? undefined : {
        level: level,
      },
      numbering: ordered ? {
        reference: 'default-numbering',
        level: level,
      } : undefined,
      children: content,
      spacing: {
        before: listStyle?.spacing?.before,
        after: listStyle?.spacing?.after,
        line: listStyle?.spacing?.line || 360
      },
      alignment: listStyle?.alignment === "justify" ? "both" : listStyle?.alignment,
      indent: {
        left: listStyle?.indent?.left || 360,
        right: listStyle?.indent?.right,
        firstLine: listStyle?.indent?.firstLine,
        hanging: listStyle?.indent?.hanging
      }
    });
  }

  private createBlockquote(content: TextRun[]): Paragraph {
    const blockquoteStyle = this.effectiveStyleConfig.blockquoteStyle;

    return new Paragraph({
      children: content,
      indent: {
        left: blockquoteStyle?.indent?.left || 720,
        right: blockquoteStyle?.indent?.right,
        firstLine: blockquoteStyle?.indent?.firstLine,
        hanging: blockquoteStyle?.indent?.hanging
      },
      border: blockquoteStyle?.border ? {
        left: blockquoteStyle.border.left ? {
          style: blockquoteStyle.border.left.style === "dash" ? "dashed" : blockquoteStyle.border.left.style,
          size: blockquoteStyle.border.left.size,
          color: blockquoteStyle.border.left.color
        } : undefined
      } : {
        left: {
          style: "single",
          size: 4,
          color: "#CCCCCC"
        }
      },
      spacing: {
        before: blockquoteStyle?.spacing?.before,
        after: blockquoteStyle?.spacing?.after,
        line: blockquoteStyle?.spacing?.line || 360
      },
      alignment: blockquoteStyle?.alignment === "justify" ? "both" : blockquoteStyle?.alignment,
      shading: blockquoteStyle?.shading ? {
        fill: blockquoteStyle.shading.fill,
        type: blockquoteStyle.shading.type,
        color: blockquoteStyle.shading.color
      } : undefined
    });
  }

  private createCodeBlock(code: string, language: string): Paragraph {
    const codeBlockStyle = this.effectiveStyleConfig.codeBlockStyle;
    const codeTextStyle = {
      font: codeBlockStyle?.codeFont || codeBlockStyle?.font || 'Courier New',
      size: codeBlockStyle?.size || 20,
      color: codeBlockStyle?.color || '000000',
      bold: codeBlockStyle?.bold,
      italic: codeBlockStyle?.italic
    };

    const lines = code.replace(/\r\n/g, '\n').split('\n');
    const children = lines.flatMap((line, index) => {
      const run = new TextRun({
        text: line.length > 0 ? line : ' ',
        break: index === 0 ? 0 : 1,
        ...this.convertTextStyleToDocx(codeTextStyle)
      });
      return [run];
    });

    return new Paragraph({
      children,
      spacing: {
        before: codeBlockStyle?.spacing?.before,
        after: codeBlockStyle?.spacing?.after,
        line: codeBlockStyle?.spacing?.line || 240
      },
      alignment: codeBlockStyle?.alignment === "justify" ? "both" : codeBlockStyle?.alignment,
      indent: {
        left: codeBlockStyle?.indent?.left,
        right: codeBlockStyle?.indent?.right,
        firstLine: codeBlockStyle?.indent?.firstLine,
        hanging: codeBlockStyle?.indent?.hanging
      },
      shading: {
        type: 'solid',
        color: codeBlockStyle?.backgroundColor || 'F5F5F5',
      }
    });
  }

  /**
   * 创建表格 - 支持新的表格样式和配置
   * 保持向后兼容旧的TextRun[][][]格式
   */
  private createTable(rows: TextRun[][][]): Table {
    if (rows.length === 0) return new Table({rows: []});

    // 将旧格式转换为新的TableData格式
    const tableData: TableData = {
      rows: rows.map(row => row.map(cellContent => ({
        content: cellContent
      }))),
      style: this.effectiveStyleConfig.tableStyles?.default
    };

    // 使用TableBuilder创建表格
    return TableBuilder.createTable(tableData, this.effectiveStyleConfig.tableStyles?.default);
  }

  /**
   * 从TableData创建表格（新方法）
   */
  private createTableFromData(tableData: TableData): Table {
    return TableBuilder.createTable(tableData, this.effectiveStyleConfig.tableStyles?.default);
  }

  /**
   * 创建表格（旧方法，保持兼容）
   */
  private createTableLegacy(rows: TextRun[][][]): Table {
    if (rows.length === 0) return new Table({rows: []});

    const isHeaderRow = (index: number) => index === 0;
    const tableStyle = this.effectiveStyleConfig.tableStyles?.default;
    
    const columnCount = rows[0]?.length || 0;
    const columnWidths = tableStyle?.columnWidths ||
      Array(columnCount).fill(Math.floor(10000 / columnCount));
    
    return new Table({
      width: tableStyle?.width || {
        size: 100,
        type: 'pct'
      },
      columnWidths: columnWidths,
      borders: tableStyle?.borders ? {
        top: tableStyle.borders.top ? {
          style: tableStyle.borders.top.style === "dash" ? "dashed" : tableStyle.borders.top.style,
          size: tableStyle.borders.top.size,
          color: tableStyle.borders.top.color
        } : undefined,
        bottom: tableStyle.borders.bottom ? {
          style: tableStyle.borders.bottom.style === "dash" ? "dashed" : tableStyle.borders.bottom.style,
          size: tableStyle.borders.bottom.size,
          color: tableStyle.borders.bottom.color
        } : undefined,
        left: tableStyle.borders.left ? {
          style: tableStyle.borders.left.style === "dash" ? "dashed" : tableStyle.borders.left.style,
          size: tableStyle.borders.left.size,
          color: tableStyle.borders.left.color
        } : undefined,
        right: tableStyle.borders.right ? {
          style: tableStyle.borders.right.style === "dash" ? "dashed" : tableStyle.borders.right.style,
          size: tableStyle.borders.right.size,
          color: tableStyle.borders.right.color
        } : undefined,
        insideHorizontal: tableStyle.borders.insideHorizontal ? {
          style: tableStyle.borders.insideHorizontal.style === "dash" ? "dashed" : tableStyle.borders.insideHorizontal.style,
          size: tableStyle.borders.insideHorizontal.size,
          color: tableStyle.borders.insideHorizontal.color
        } : undefined,
        insideVertical: tableStyle.borders.insideVertical ? {
          style: tableStyle.borders.insideVertical.style === "dash" ? "dashed" : tableStyle.borders.insideVertical.style,
          size: tableStyle.borders.insideVertical.size,
          color: tableStyle.borders.insideVertical.color
        } : undefined
      } : {
        top: { style: 'single', size: 4, color: '000000' },
        bottom: { style: 'single', size: 4, color: '000000' },
        left: { style: 'single', size: 4, color: '000000' },
        right: { style: 'single', size: 4, color: '000000' },
        insideHorizontal: { style: 'single', size: 2, color: 'DDDDDD' },
        insideVertical: { style: 'single', size: 2, color: 'DDDDDD' }
      },
      rows: rows.map((row, rowIndex) => new TableRow({
        children: row.map((cellContent, cellIndex) => {
          // 确定单元格对齐方式
          const cellHorizontalAlign = isHeaderRow(rowIndex)
            ? (tableStyle?.headerStyle?.alignment || tableStyle?.alignment || 'center')
            : (tableStyle?.cellAlignment?.horizontal || tableStyle?.alignment || 'left');
          
          const cellVerticalAlign = tableStyle?.cellAlignment?.vertical || 'center';
          
          // 应用斑马纹样式
          const isOddRow = rowIndex % 2 === 1;
          const rowShading = tableStyle?.stripedRows?.enabled
            ? (isOddRow
                ? tableStyle.stripedRows.oddRowShading
                : tableStyle.stripedRows.evenRowShading)
            : undefined;
          
          return new TableCell({
            children: [new Paragraph({
              children: cellContent,
              spacing: {
                line: 360 // 1.5倍行距
              },
              alignment: cellHorizontalAlign === 'center' ? AlignmentType.CENTER :
                        cellHorizontalAlign === 'right' ? AlignmentType.RIGHT :
                        AlignmentType.LEFT
            })],
            verticalAlign: cellVerticalAlign === 'bottom' ? 'bottom' :
                          cellVerticalAlign === 'top' ? 'top' :
                          'center',
          shading: isHeaderRow(rowIndex) ? {
            fill: tableStyle?.headerStyle?.shading || 'E0E0E0',
            type: 'solid',
            color: tableStyle?.headerStyle?.shading || 'E0E0E0'
          } : (rowShading ? {
            fill: rowShading,
            type: 'solid',
            color: rowShading
          } : undefined),
          borders: isHeaderRow(rowIndex) ? (tableStyle?.borders ? {
            top: tableStyle.borders.top ? {
              style: tableStyle.borders.top.style === "dash" ? "dashed" : tableStyle.borders.top.style,
              size: tableStyle.borders.top.size,
              color: tableStyle.borders.top.color
            } : undefined,
            bottom: tableStyle.borders.bottom ? {
              style: tableStyle.borders.bottom.style === "dash" ? "dashed" : tableStyle.borders.bottom.style,
              size: tableStyle.borders.bottom.size,
              color: tableStyle.borders.bottom.color
            } : undefined,
            left: tableStyle.borders.left ? {
              style: tableStyle.borders.left.style === "dash" ? "dashed" : tableStyle.borders.left.style,
              size: tableStyle.borders.left.size,
              color: tableStyle.borders.left.color
            } : undefined,
            right: tableStyle.borders.right ? {
              style: tableStyle.borders.right.style === "dash" ? "dashed" : tableStyle.borders.right.style,
              size: tableStyle.borders.right.size,
              color: tableStyle.borders.right.color
            } : undefined
          } : {
            top: { style: 'single', size: 4, color: '000000' },
            bottom: { style: 'single', size: 4, color: '000000' },
            left: { style: 'single', size: 4, color: '000000' },
            right: { style: 'single', size: 4, color: '000000' }
          }) : undefined,
          margins: tableStyle?.cellMargin || {
            top: 100,
            bottom: 100,
            left: 100,
            right: 100
          },
          width: columnWidths[cellIndex] ? {
            size: columnWidths[cellIndex],
            type: 'dxa'
          } : undefined
        });
        }),
        tableHeader: isHeaderRow(rowIndex) // 标记表头行
      }))
    });
  }

  private createParagraphWithImages(content: (TextRun | ImageRun)[]): Paragraph {
    const normalStyle = this.effectiveStyleConfig.paragraphStyles?.normal;
    
    return new Paragraph({
      children: content,
      spacing: {
        before: normalStyle?.spacing?.before,
        after: normalStyle?.spacing?.after,
        line: normalStyle?.spacing?.line || 360
      },
      alignment: normalStyle?.alignment === "justify" ? "both" : normalStyle?.alignment,
      indent: {
        left: normalStyle?.indent?.left,
        right: normalStyle?.indent?.right,
        firstLine: normalStyle?.indent?.firstLine,
        hanging: normalStyle?.indent?.hanging
      }
    });
  }

  private async extractTableData(tokens: any[], startIndex: number, mathBlocks?: Array<{latex: string; startIndex: number; endIndex: number; inline: boolean}>): Promise<{ rows: any[][][]; endIndex: number }> {
    const rows: any[][][] = [];
    let currentRow: any[][] = [];
    let i = startIndex + 1;

    while (i < tokens.length && tokens[i].type !== 'table_close') {
      if (tokens[i].type === 'tr_open') {
        currentRow = [];
      } else if (tokens[i].type === 'tr_close') {
        rows.push(currentRow);
      } else if (tokens[i].type === 'td_open' || tokens[i].type === 'th_open') {
        const content = await this.processInlineContentAsync(tokens[i + 1], undefined, mathBlocks);
        currentRow.push(content as TextRun[]);
        i++; // Skip content token
      }
      i++;
    }

    return {
      rows,
      endIndex: i
    };
  }
}